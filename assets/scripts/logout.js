(async () => {
    const endpointIp = await getEndpointIp();

    $(document).ready(() => {
        fetch(endpointIp + '/store/logout', { method: 'POST', headers: { session: getCookie('session') } }).then(() => {
            setCookie("session", '')
            window.location.href = "/login"
        })
    })
})()