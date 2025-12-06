export default function Index() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-b from-background/40 to-transparent">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto bg-card/80 dark:bg-card/90 rounded-2xl p-10 shadow-lg">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground">
            Template
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            A modern, reusable starter template with theming, routing and a
            small component set. Replace pages and components to build your app.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/contact"
              className="inline-block px-5 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-95"
            >
              Get in touch
            </a>
            <a
              href="/portfolio"
              className="inline-block px-5 py-2 rounded-md border hover:bg-muted"
            >
              View examples
            </a>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-background/60 dark:bg-background/70">
              <h3 className="font-semibold">Theming</h3>
              <p className="text-sm text-muted-foreground">
                Light & dark theme with a toggle.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background/60 dark:bg-background/70">
              <h3 className="font-semibold">Routing</h3>
              <p className="text-sm text-muted-foreground">
                React Router powered pages and NotFound handling.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background/60 dark:bg-background/70">
              <h3 className="font-semibold">Components</h3>
              <p className="text-sm text-muted-foreground">
                A small UI set ready to extend for your project.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
