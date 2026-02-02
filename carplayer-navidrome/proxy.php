<?php
declare(strict_types=1);

/**
 * Proxy MUY restringido para Navidrome (Subsonic REST API).
 *
 * Motivo: evitar CORS cuando el frontend está en otro subdominio.
 *
 * Permite SOLO:
 * - /rest/*.view (incluye stream, cover, browse, search, etc)
 *
 * Configuración: crea `proxy.config.php` en esta misma carpeta.
 */

$NAVIDROME_BASE_URL = null;
$ALLOW_INSECURE_TLS = false;

$configPath = __DIR__ . '/proxy.config.php';
if (is_file($configPath)) {
  require $configPath;
}

function respond_json(int $status, array $payload): void {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
  exit;
}

function starts_with(string $haystack, string $needle): bool {
  if ($needle === '') return true;
  return strncmp($haystack, $needle, strlen($needle)) === 0;
}

if (isset($_GET['ping'])) {
  $configured = is_string($NAVIDROME_BASE_URL) && trim($NAVIDROME_BASE_URL) !== '';
  respond_json(200, [
    'ok' => true,
    'configured' => $configured,
    'needsConfigFile' => !$configured,
  ]);
}

if (!is_string($NAVIDROME_BASE_URL) || trim($NAVIDROME_BASE_URL) === '') {
  respond_json(500, [
    'ok' => false,
    'error' => 'proxy_not_configured',
    'message' => 'Crea carplayer-navidrome/proxy.config.php (ver proxy.config.sample.php).',
  ]);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!is_string($method) || $method === '') {
  $method = 'GET';
}
$method = strtoupper($method);

if ($method === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$target = $_GET['target'] ?? '';
if (!is_string($target)) $target = '';
$target = trim($target);

if ($target === '') {
  respond_json(400, ['ok' => false, 'error' => 'missing_target']);
}

if (preg_match('~^[a-zA-Z][a-zA-Z0-9+.-]*://~', $target)) {
  respond_json(400, ['ok' => false, 'error' => 'absolute_url_not_allowed']);
}
if (!starts_with($target, '/') || starts_with($target, '//')) {
  respond_json(400, ['ok' => false, 'error' => 'target_must_be_absolute_path']);
}

$path = parse_url($target, PHP_URL_PATH);
if (!is_string($path) || $path === '') {
  respond_json(400, ['ok' => false, 'error' => 'invalid_target_path']);
}

// Allowlist: /rest/*.view only
$allowed = (bool)preg_match('~^/rest/[A-Za-z0-9_.-]+\.view$~', $path);
if (!$allowed) {
  respond_json(403, ['ok' => false, 'error' => 'forbidden_target', 'path' => $path]);
}

$upstream = rtrim($NAVIDROME_BASE_URL, '/') . $target;

$ch = curl_init($upstream);
if ($ch === false) {
  respond_json(500, ['ok' => false, 'error' => 'curl_init_failed']);
}

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_TIMEOUT, 25);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

if ($ALLOW_INSECURE_TLS) {
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
  curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
}

$headers = [];
$headers[] = 'User-Agent: CarPlayerNavidromeProxy/1.0';
if (isset($_SERVER['HTTP_ACCEPT'])) $headers[] = 'Accept: ' . $_SERVER['HTTP_ACCEPT'];
if (isset($_SERVER['CONTENT_TYPE'])) $headers[] = 'Content-Type: ' . $_SERVER['CONTENT_TYPE'];
if (isset($_SERVER['HTTP_RANGE'])) $headers[] = 'Range: ' . $_SERVER['HTTP_RANGE'];
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

if ($method !== 'GET' && $method !== 'HEAD') {
  $body = file_get_contents('php://input');
  if ($body !== false && $body !== '') {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
  }
}

$raw = curl_exec($ch);
if ($raw === false) {
  $err = curl_error($ch);
  curl_close($ch);
  respond_json(502, ['ok' => false, 'error' => 'upstream_error', 'detail' => $err]);
}

$status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$headerSize = (int)curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

$rawHeaders = substr($raw, 0, $headerSize);
$rawBody = substr($raw, $headerSize);

http_response_code($status > 0 ? $status : 502);

$passHeaders = [
  'content-type' => true,
  'content-disposition' => true,
  'cache-control' => true,
  'pragma' => true,
  'expires' => true,
  'accept-ranges' => true,
  'content-range' => true,
  'etag' => true,
  'last-modified' => true,
];

foreach (preg_split("/\r\n|\n|\r/", $rawHeaders) as $line) {
  $line = trim($line);
  if ($line === '' || starts_with($line, 'HTTP/')) continue;
  $pos = strpos($line, ':');
  if ($pos === false) continue;
  $name = strtolower(trim(substr($line, 0, $pos)));
  if (!isset($passHeaders[$name])) continue;
  header($line, false);
}

echo $rawBody;

