(async () => {
    const ep = await getEndpointIp();

    $(document).ready(() => {
        fetch(ep.i + '/store/logout', { method: 'POST', headers: { session: getCookie('session'),...ep.h } }).then(() => {
            setCookie("session", '')
            window.location.href = "/login"
        })
    })
})()