/**
 * @file contactForm.js
 * @description Enhance the contact form with in-page submission feedback
 * while preserving native submission when JavaScript is unavailable.
 */

const DEFAULT_BUTTON_LABEL = 'Send message';
const SENDING_BUTTON_LABEL = 'Sending…';
const SUCCESS_MESSAGE = 'Thank you! Your message has been sent.';
const ERROR_MESSAGE =
  'Sorry, your message could not be sent. Please try again or email me directly.';

/**
 * Display the current form status.
 * @param {HTMLElement} status
 * @param {string} message
 * @param {'sending'|'success'|'error'} state
 * @returns {void}
 */
function showStatus(status, message, state) {
  status.textContent = message;
  status.classList.remove('form-status--sending', 'form-status--success', 'form-status--error');
  status.classList.add(`form-status--${state}`);
  status.hidden = false;
}

/**
 * Initialise the enhanced contact-form submission.
 * @returns {void}
 */
export function setupContactForm() {
  const form = document.querySelector('[data-contact-form]');

  if (!(form instanceof HTMLFormElement) || form.dataset.enhanced === 'true') {
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  const buttonLabel = form.querySelector('.submit-button-label');
  const status = form.querySelector('.form-status');

  if (
    !(submitButton instanceof HTMLButtonElement) ||
    !(buttonLabel instanceof HTMLElement) ||
    !(status instanceof HTMLElement)
  ) {
    return;
  }

  form.dataset.enhanced = 'true';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (form.dataset.submitting === 'true') return;

    form.dataset.submitting = 'true';
    form.setAttribute('aria-busy', 'true');
    submitButton.disabled = true;
    buttonLabel.textContent = SENDING_BUTTON_LABEL;

    showStatus(status, 'Sending your message…', 'sending');

    const formData = new FormData(form);

    /*
     * The redirect remains in the HTML for native submission,
     * but is omitted from the enhanced request so Web3Forms returns JSON.
     */
    formData.delete('redirect');

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error(result.message || ERROR_MESSAGE);
      }

      form.reset();
      showStatus(status, SUCCESS_MESSAGE, 'success');
    } catch {
      showStatus(status, ERROR_MESSAGE, 'error');
    } finally {
      form.dataset.submitting = 'false';
      form.removeAttribute('aria-busy');
      submitButton.disabled = false;
      buttonLabel.textContent = DEFAULT_BUTTON_LABEL;
    }
  });
}
