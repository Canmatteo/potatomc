async function getEndpointIp() {
    return await fetch('/endpointIp.json').then(res => res.json()).then(res => {
        console.log("fetched endpoint ip:",res.i)
        return res.i;
    })
}