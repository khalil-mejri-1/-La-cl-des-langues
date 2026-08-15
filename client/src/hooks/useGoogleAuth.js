import { useEffect, useCallback, useRef } from 'react';
import { GOOGLE_CLIENT_ID, API_BASE_URL } from '../config';
import { createNotification } from '../utils/notifications';

/**
 * Decodes a Google JWT credential (base64 payload).
 */
function decodeGoogleJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const HIDDEN_BTN_ID = '__google_hidden_signin_btn__';

/**
 * useGoogleAuth – renders a hidden Google Sign-In button and exposes
 * triggerGoogleSignIn() which programmatically clicks it on user action
 * (avoids popup blocker since it's in the same call stack as user click).
 */
export default function useGoogleAuth({ loginUser, onSuccess, onError }) {
  const callbackRef = useRef(null);
  const containerRef = useRef(null);

  // Handle Google credential response
  const handleCredentialResponse = useCallback(async (response) => {
    try {
      const payload = decodeGoogleJwt(response.credential);
      if (!payload) throw new Error('Token Google invalide.');

      const { email, name, picture, sub: googleId } = payload;

      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, picture, googleId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur Google Auth.');

      loginUser(data.user);

      // Notify admins if this is a brand new account
      if (data.isNewUser) {
        createNotification({
          type: 'NEW_USER_REGISTERED',
          targetRoles: ['admin'],
          title: { fr: '👤 Nouveau compte Google inscrit !', ar: '👤 تسجيل حساب Google جديد !', en: '👤 New Google account registered!' },
          desc: {
            fr: `${name || email} vient de créer un compte via Google.`,
            ar: `قام ${name || email} بإنشاء حساب عبر Google.`,
            en: `${name || email} registered via Google.`,
          },
          icon: 'person_add',
          iconBg: 'bg-blue-100 text-blue-700',
          link: '/admin',
          meta: { email, parentName: name },
        });
      }

      onSuccess?.(data.user, data.isNewUser);
    } catch (err) {
      onError?.(err.message);
    }
  }, [loginUser, onSuccess, onError]);

  callbackRef.current = handleCredentialResponse;

  useEffect(() => {
    // Create hidden container for Google button if not exists
    let container = document.getElementById(HIDDEN_BTN_ID);
    if (!container) {
      container = document.createElement('div');
      container.id = HIDDEN_BTN_ID;
      container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;';
      document.body.appendChild(container);
    }
    containerRef.current = container;

    // Poll until google.accounts.id is loaded
    let tries = 0;
    const init = () => {
      tries++;
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (resp) => callbackRef.current(resp),
          auto_select: false,
          cancel_on_tap_outside: true,
          ux_mode: 'popup', // Use popup mode — real browser-trusted popup
        });

        // Render the real Google button (hidden) — browser trusts this button
        window.google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: 300,
        });
      } else if (tries < 50) {
        setTimeout(init, 200);
      }
    };
    init();

    return () => {
      // Don't remove on unmount — other instances may need it
    };
  }, []);

  /**
   * triggerGoogleSignIn — MUST be called directly from a user click handler
   * to avoid popup blockers. It finds the hidden Google button and clicks it.
   */
  const triggerGoogleSignIn = useCallback(() => {
    const container = document.getElementById(HIDDEN_BTN_ID);
    if (container) {
      // Click the real Google button inside the hidden container
      const btn = container.querySelector('div[role="button"]') ||
                  container.querySelector('button') ||
                  container.firstElementChild;
      if (btn) {
        btn.click();
        return;
      }
    }
    // Fallback: use One Tap if button not found
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      onError?.('Google Identity Services non chargé. Actualisez la page et réessayez.');
    }
  }, [onError]);

  return { triggerGoogleSignIn };
}

