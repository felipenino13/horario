self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const appWindow = clients.find((client) => "focus" in client);
      return appWindow ? appWindow.focus() : self.clients.openWindow("/");
    }),
  );
});
