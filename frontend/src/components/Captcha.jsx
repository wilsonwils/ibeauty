import React, { useEffect, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";

const SITE_KEY = "6LdRmR4sAAAAAGF-p-8trzUtRTmUfYTEU8WoAuu1";

const Captcha = ({ setCaptchaValue, captchaValue }) => {
  const recaptchaRef = useRef();

  //  Reset captcha whenever parent sets captchaValue = null
  useEffect(() => {
    if (!captchaValue && recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  }, [captchaValue]);

  return (
    <ReCAPTCHA
      ref={recaptchaRef}
      sitekey={SITE_KEY}
      onChange={(token) => setCaptchaValue(token)}
    />
  );
};

export default Captcha;
