export default defineContentScript({
  matches: ['<all_urls>'],
  main(ctx) {
    // Listen for messages from background script
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === 'LEAD_CAPTURED' && message.success) {
        showToast(`Lead captured: ${message.leadName}`);
      }
    });

    // Show toast notification
    function showToast(text: string) {
      // Check if toast already exists
      const existingToast = document.getElementById('leadsnap-toast');
      if (existingToast) {
        existingToast.remove();
      }

      // Create toast element
      const toast = document.createElement('div');
      toast.id = 'leadsnap-toast';
      toast.innerHTML = `
        <div style="
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 2147483647;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: leadsnap-slide-in 0.3s ease-out;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          ${text}
        </div>
        <style>
          @keyframes leadsnap-slide-in {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes leadsnap-slide-out {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
        </style>
      `;

      document.body.appendChild(toast);

      // Auto remove after 3 seconds
      ctx.setTimeout(() => {
        const toastEl = toast.querySelector('div');
        if (toastEl) {
          toastEl.style.animation = 'leadsnap-slide-out 0.3s ease-in forwards';
        }
        ctx.setTimeout(() => {
          toast.remove();
        }, 300);
      }, 3000);
    }

    console.log('LeadSnap: Content script loaded');
  },
});
