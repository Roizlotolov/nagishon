import { init } from "../src";

init({
  statementUrl: "/statement.html",
  contactUrl: "mailto:accessibility@example.com",
  skipLink: { target: "#main" },
});
