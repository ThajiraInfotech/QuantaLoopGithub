/* Quanta Loop — Web Push service worker (scope: /) */

self.addEventListener("push", (event) => {
  let payload = {
    title: "Quanta Loop",
    body: "You have a new notification",
    icon: "/icon.png",
    badge: "/icon.png",
    tag: "quanta-loop",
    data: { url: "/dashboard" },
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || "/icon.png",
      badge: payload.badge || "/icon.png",
      tag: payload.tag || "quanta-loop",
      data: payload.data || { url: "/dashboard" },
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/dashboard";
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (!client.url.startsWith(self.location.origin)) continue;
          if ("focus" in client) {
            if ("navigate" in client) {
              return client.navigate(absoluteUrl).then(() => client.focus());
            }
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(absoluteUrl);
        }
        return undefined;
      })
  );
});
