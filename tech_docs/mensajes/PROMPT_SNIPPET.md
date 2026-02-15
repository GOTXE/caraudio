Modo mensajes externos (persistente):
- Solo envio unidireccional a Synology Chat.
- Script oficial: `/data/projects/caraudio/tech_docs/mensajes/synology_incoming_send.py`
- Si necesito avisarte fuera del PC, envio mensaje al webhook incoming.
- Formato obligatorio: prefijo `[YYYY-MM-DD HH:MM:SS]` al inicio del texto.
- No usar polling ni lectura de respuestas.

Comando de envio:
`python3 /data/projects/caraudio/tech_docs/mensajes/synology_incoming_send.py --url 'https://srv.dimoti.myds.me/chat/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=TU_TOKEN' --prepend-datetime --text 'TU_MENSAJE'`
