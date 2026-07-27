const BUS_EMOJI_PATTERN = /(🚌|🚍)/g;

const IGNORED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEXTAREA",
  "INPUT",
  "OPTION",
  "CODE",
  "PRE",
  "SVG",
]);

const isInsideIgnoredElement = (node) => {
  let parent = node.parentElement;

  while (parent) {
    if (
      IGNORED_TAGS.has(parent.tagName) ||
      parent.dataset.rularBusIcon === "true"
    ) {
      return true;
    }

    parent = parent.parentElement;
  }

  return false;
};

const createBusIcon = () => {
  const image = document.createElement("img");

  image.src =
    "/branding/rular-bus-icon.png";

  image.alt = "";
  image.setAttribute(
    "aria-hidden",
    "true"
  );

  image.className =
    "rular-global-bus-icon";

  image.dataset.rularBusIcon =
    "true";

  image.draggable = false;

  return image;
};

const replaceBusEmojiInTextNode = (
  textNode
) => {
  if (
    !textNode ||
    textNode.nodeType !==
      Node.TEXT_NODE ||
    !textNode.nodeValue ||
    !BUS_EMOJI_PATTERN.test(
      textNode.nodeValue
    ) ||
    isInsideIgnoredElement(
      textNode
    )
  ) {
    BUS_EMOJI_PATTERN.lastIndex = 0;
    return;
  }

  BUS_EMOJI_PATTERN.lastIndex = 0;

  const text =
    textNode.nodeValue;

  const fragment =
    document.createDocumentFragment();

  let lastIndex = 0;
  let match;

  while (
    (match =
      BUS_EMOJI_PATTERN.exec(
        text
      )) !== null
  ) {
    const before =
      text.slice(
        lastIndex,
        match.index
      );

    if (before) {
      fragment.appendChild(
        document.createTextNode(
          before
        )
      );
    }

    fragment.appendChild(
      createBusIcon()
    );

    lastIndex =
      match.index +
      match[0].length;
  }

  const remaining =
    text.slice(lastIndex);

  if (remaining) {
    fragment.appendChild(
      document.createTextNode(
        remaining
      )
    );
  }

  textNode.parentNode?.replaceChild(
    fragment,
    textNode
  );

  BUS_EMOJI_PATTERN.lastIndex = 0;
};

const processElement = (root) => {
  if (!root) {
    return;
  }

  if (
    root.nodeType ===
    Node.TEXT_NODE
  ) {
    replaceBusEmojiInTextNode(
      root
    );
    return;
  }

  if (
    root.nodeType !==
      Node.ELEMENT_NODE &&
    root.nodeType !==
      Node.DOCUMENT_FRAGMENT_NODE
  ) {
    return;
  }

  const walker =
    document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (
            !node.nodeValue ||
            !BUS_EMOJI_PATTERN.test(
              node.nodeValue
            ) ||
            isInsideIgnoredElement(
              node
            )
          ) {
            BUS_EMOJI_PATTERN.lastIndex =
              0;

            return NodeFilter
              .FILTER_REJECT;
          }

          BUS_EMOJI_PATTERN.lastIndex =
            0;

          return NodeFilter
            .FILTER_ACCEPT;
        },
      }
    );

  const textNodes = [];

  while (walker.nextNode()) {
    textNodes.push(
      walker.currentNode
    );
  }

  textNodes.forEach(
    replaceBusEmojiInTextNode
  );
};

const startObserver = () => {
  processElement(
    document.body
  );

  const observer =
    new MutationObserver(
      (mutations) => {
        mutations.forEach(
          (mutation) => {
            mutation.addedNodes.forEach(
              (node) => {
                processElement(node);
              }
            );

            if (
              mutation.type ===
              "characterData"
            ) {
              replaceBusEmojiInTextNode(
                mutation.target
              );
            }
          }
        );
      }
    );

  observer.observe(
    document.body,
    {
      childList: true,
      subtree: true,
      characterData: true,
    }
  );

  return observer;
};

export const installRularBusIcons =
  () => {
    if (
      typeof window ===
        "undefined" ||
      typeof document ===
        "undefined"
    ) {
      return null;
    }

    const start = () => {
      if (
        window
          .__RULAR_BUS_ICON_OBSERVER__
      ) {
        return;
      }

      window
        .__RULAR_BUS_ICON_OBSERVER__ =
        startObserver();
    };

    if (
      document.readyState ===
      "loading"
    ) {
      document.addEventListener(
        "DOMContentLoaded",
        start,
        {
          once: true,
        }
      );
    } else {
      start();
    }

    return window
      .__RULAR_BUS_ICON_OBSERVER__;
  };
