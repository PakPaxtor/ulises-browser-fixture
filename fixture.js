(() => {
  "use strict";

  const status = document.getElementById("status");
  const params = new URLSearchParams(window.location.search);
  const requestedMode = params.get("mode") || "idle";
  const mode = ["idle", "transport", "request-pressure", "event-pressure"].includes(requestedMode)
    ? requestedMode
    : "idle";
  const nonce = (params.get("nonce") || "fixed").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
  const records = [];

  function record(kind, outcome, detail = "") {
    records.push({ kind, outcome, detail: String(detail).slice(0, 120) });
    status.textContent = JSON.stringify({ mode, records }, null, 2);
  }

  function sameOrigin(path) {
    return new URL(path, window.location.href).toString();
  }

  async function attempt(label, operation) {
    try {
      await operation();
      record(label, "resolved");
    } catch (error) {
      record(label, "rejected", error && error.name ? error.name : "Error");
    }
  }

  async function runTransport() {
    record("fixture", "started", "transport");

    void attempt("same_origin_get", async () => {
      await fetch(sameOrigin(`payload.txt?case=get&nonce=${nonce}`), { cache: "no-store" });
    });

    void attempt("same_origin_post", async () => {
      await fetch(sameOrigin(`payload.txt?case=post&nonce=${nonce}`), {
        method: "POST",
        body: "ulises-finite-post",
        cache: "no-store"
      });
    });

    try {
      const accepted = navigator.sendBeacon(
        sameOrigin(`payload.txt?case=beacon&nonce=${nonce}`),
        "ulises-finite-beacon"
      );
      record("same_origin_beacon", accepted ? "accepted" : "rejected");
    } catch (error) {
      record("same_origin_beacon", "rejected", error && error.name ? error.name : "Error");
    }

    try {
      const stream = new EventSource(sameOrigin(`events?nonce=${nonce}`));
      stream.onerror = () => stream.close();
      record("same_origin_eventsource", "constructed");
    } catch (error) {
      record("same_origin_eventsource", "rejected", error && error.name ? error.name : "Error");
    }

    try {
      const socketUrl = new URL(`socket?nonce=${nonce}`, window.location.href);
      socketUrl.protocol = "wss:";
      const socket = new WebSocket(socketUrl.toString());
      socket.onerror = () => socket.close();
      record("same_origin_websocket", "constructed");
    } catch (error) {
      record("same_origin_websocket", "rejected", error && error.name ? error.name : "Error");
    }

    try {
      const peer = new RTCPeerConnection({ iceServers: [] });
      let candidateCount = 0;
      let literalAddressCount = 0;
      peer.createDataChannel("ulises-bounded-probe");
      peer.onicecandidate = (event) => {
        if (!event.candidate) {
          record("webrtc_candidates", "complete", `${candidateCount}:${literalAddressCount}`);
          peer.close();
          return;
        }
        candidateCount += 1;
        const candidate = event.candidate.candidate || "";
        if (/\b(?:\d{1,3}\.){3}\d{1,3}\b|\[[0-9a-f:]+\]/i.test(candidate)) {
          literalAddressCount += 1;
        }
      };
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      record("webrtc_peer_connection", "started");
      window.setTimeout(() => {
        if (peer.connectionState !== "closed") {
          record("webrtc_candidates", "bounded_timeout", `${candidateCount}:${literalAddressCount}`);
          peer.close();
        }
      }, 1200);
    } catch (error) {
      record("webrtc_peer_connection", "rejected", error && error.name ? error.name : "Error");
    }

    window.alert("ulises-bounded-dialog");
    record("javascript_dialog", "returned_after_dismissal");

    const popup = window.open(sameOrigin(`popup.html?nonce=${nonce}`), "ulises_bounded_popup");
    record("same_origin_popup", popup ? "created" : "browser_rejected");

    const download = document.createElement("a");
    download.href = sameOrigin(`payload.txt?case=download&nonce=${nonce}`);
    download.download = "ulises-fixture-payload.txt";
    download.hidden = true;
    document.body.appendChild(download);
    download.click();
    download.remove();
    record("same_origin_download", "triggered");

    window.setTimeout(() => record("fixture", "finished", "transport"), 1800);
  }

  function runRequestPressure() {
    record("fixture", "started", "request-pressure");
    for (let index = 0; index < 64; index += 1) {
      void fetch(sameOrigin(`payload.txt?case=pressure&index=${index}&nonce=${nonce}`), {
        cache: "no-store"
      }).catch(() => undefined);
    }
    record("request_pressure", "dispatched", "64");
  }

  function runEventPressure() {
    record("fixture", "started", "event-pressure");
    for (let index = 0; index < 20; index += 1) {
      window.alert(`ulises-bounded-event-${index}`);
    }
    record("event_pressure", "dispatched", "20");
  }

  if (mode === "transport") {
    window.setTimeout(() => void runTransport(), 250);
  } else if (mode === "request-pressure") {
    window.setTimeout(runRequestPressure, 250);
  } else if (mode === "event-pressure") {
    window.setTimeout(runEventPressure, 250);
  } else {
    record("fixture", "idle");
  }
})();
