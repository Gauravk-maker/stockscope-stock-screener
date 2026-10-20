
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateRoot, mockRender } = vi.hoisted(() => ({
  mockCreateRoot: vi.fn(),
  mockRender: vi.fn(),
}));

vi.mock("react-dom/client", () => ({
  createRoot: mockCreateRoot,
}));

vi.mock("../App.jsx", () => ({
  default: () => null,
}));

vi.mock("../settings-fix.css", () => ({}));
vi.mock("../styles.css", () => ({}));

describe("main.jsx entry point", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mockCreateRoot.mockReturnValue({
      render: mockRender,
    });

    document.body.innerHTML = '<div id="root"></div>';
  });

  it("creates a React root using the root DOM element", async () => {
    await import("../main.jsx");

    expect(mockCreateRoot).toHaveBeenCalledWith(
      document.getElementById("root")
    );
  });

  it("renders the application inside React StrictMode", async () => {
    await import("../main.jsx");

    expect(mockRender).toHaveBeenCalledTimes(1);

    const renderedElement = mockRender.mock.calls[0][0];

    expect(renderedElement.type).toBe(
      (await import("react")).StrictMode
    );
  });
});
