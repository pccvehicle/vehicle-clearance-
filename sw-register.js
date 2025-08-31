if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // ====================================================================
    // FIX: Specify the correct scope for a GitHub Project Page.
    // The path must match your repository name.
    // ====================================================================
    const scope = '/vehicle-clearance-/';
    
    navigator.serviceWorker.register('sw.js', { scope: scope })
      .then(registration => {
        console.log('Service Worker registered successfully with scope: ', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed: ', error);
      });
  });
}

