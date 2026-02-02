<?php
/**
 * Copia este archivo como `proxy.config.php` y ajusta los valores.
 *
 * Objetivo: permitir que una web servida desde `caraudio.*` pueda hablar con
 * DSM WebAPI (por ejemplo `apimusic.*`) SIN CORS, haciendo el fetch desde el NAS.
 */

// Base URL del DSM publicado (debe incluir esquema https:// y NO terminar en /webapi).
// Ejemplos:
// - 'https://apimusic.sekhem.myds.me'
// - 'https://sek.sekhem.myds.me'
$DSM_BASE_URL = 'https://apimusic.sekhem.myds.me';

// Solo si usas un destino con certificado no válido (no recomendado).
$ALLOW_INSECURE_TLS = false;

