// Set a cookie
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// Get a cookie
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Get all cookies
function allCookies() {
    const cookies = document.cookie.split(';');
    return cookies.map(cookie => {
        const [name, ...rest] = cookie.split('=');
        return { name: name.trim(), value: rest.join('=').trim(), expires: document.cookie.match(/expires=([^;]+)/)?.[1] || 'Session' };
    });
}

// Erase a cookie
function eraseCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999;';
}

export { setCookie, getCookie, eraseCookie, allCookies };