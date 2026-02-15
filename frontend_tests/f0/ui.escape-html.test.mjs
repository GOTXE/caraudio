import test from "node:test";
import assert from "node:assert/strict";

import { escapeHtml } from "../../assets/js/modules/ui.js";

test("escapeHtml escapes dangerous characters", () => {
  const raw = `<script>alert("x")</script> & '`;
  const escaped = escapeHtml(raw);
  assert.equal(escaped, "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;");
});
