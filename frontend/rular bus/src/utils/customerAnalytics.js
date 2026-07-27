const SESSION_KEY =
  "rular_bus_anonymous_session_id";

export const getAnonymousSessionId = () => {
  let sessionId =
    window.localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId =
      window.crypto?.randomUUID?.() ||
      `rb-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

    window.localStorage.setItem(
      SESSION_KEY,
      sessionId
    );
  }

  return sessionId;
};

export const detectClientChannel = () => {
  const userAgent = navigator.userAgent || "";

  const isMobile =
    /Android|iPhone|iPad|iPod|Mobile/i.test(
      userAgent
    );

  return isMobile
    ? "MOBILE_WEB"
    : "DESKTOP_WEB";
};

export const detectDeviceInfo = () => {
  const userAgent = navigator.userAgent || "";

  let operatingSystem = "OTHER";

  if (/Android/i.test(userAgent)) {
    operatingSystem = "ANDROID";
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    operatingSystem = "IOS";
  } else if (/Windows/i.test(userAgent)) {
    operatingSystem = "WINDOWS";
  } else if (/Mac OS/i.test(userAgent)) {
    operatingSystem = "MACOS";
  } else if (/Linux/i.test(userAgent)) {
    operatingSystem = "LINUX";
  }

  let browserName = "OTHER";

  if (/Edg\//i.test(userAgent)) {
    browserName = "EDGE";
  } else if (/Chrome\//i.test(userAgent)) {
    browserName = "CHROME";
  } else if (/Firefox\//i.test(userAgent)) {
    browserName = "FIREFOX";
  } else if (/Safari\//i.test(userAgent)) {
    browserName = "SAFARI";
  }

  return {
    device_type:
      detectClientChannel() === "MOBILE_WEB"
        ? "MOBILE"
        : "DESKTOP",
    operating_system: operatingSystem,
    browser_name: browserName,
  };
};
