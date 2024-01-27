particlesJS.load('particles-js', '/assets/particlesjs-config.json', function () {
    console.log('callback - particles.js config loaded');
});

$(document).ready(async () => {
    fetch(await getEndpointIp() + '/stats').then(res => res.json()).then(res => {
        if (!res.success) return;
        const p = res.stats.players.online;
        $('#players_online').text(p + ' Spieler' + (p === 1 ? '' : 'n'))
    })
})

function copyIp() {
    const ip = $('#ip');
    const ta = $('<input>').val(ip.text());
    $("body").append(ta)
    ta.select();
    document.execCommand('copy');
    new SnackBar({
        status: "success",
        icon: "✔️",
        message: "Die IP-Adresse wurde in die Zwischenablage kopiert!",
        fixed: true
    })
    ta.remove()
}