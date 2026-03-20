document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('pre > code').forEach((codeBlock) => {
    const pre = codeBlock.parentElement;
    pre.style.position = 'relative';

    const button = document.createElement('button');
    button.className = 'copy-btn';
    button.textContent = 'Copy';

    button.addEventListener('click', () => {
      navigator.clipboard.writeText(codeBlock.textContent).then(() => {
        button.textContent = 'Copied!';
        button.classList.add('copy-btn--copied');
        setTimeout(() => {
          button.textContent = 'Copy';
          button.classList.remove('copy-btn--copied');
        }, 2000);
      });
    });

    pre.appendChild(button);
  });
});
