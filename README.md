# Ulises public hostile-browser fixture

This directory is the private-project mirror of the deliberately bounded
fixture published at:

- `https://pakpaxtor.github.io/ulises-browser-fixture/`
- `https://github.com/PakPaxtor/ulises-browser-fixture`

The default page is inert. Two explicit query modes are available:

- `?mode=transport` performs one finite batch of same-origin POST, beacon,
  EventSource, WebSocket, WebRTC, dialog, popup and download attempts.
- `?mode=request-pressure` performs 64 finite same-origin GET attempts so a
  low request budget must fail the whole observation closed.

There are no third-party destinations, credentials, user data, persistence,
tracking, recursive timers or unbounded loops. This fixture is evidence for a
specific bounded browser policy, not a claim of general hostile-web safety.

