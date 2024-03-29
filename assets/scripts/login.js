(async () => {
    const ep = await getEndpointIp();

    const params = new URL(document.location).searchParams;
    const code = params.get("c")

    $(document).ready(() => {
        if (code?.length > 0) {
            signIn()
        }
    })

    function signIn() {
        $('#instructables').fadeOut('fast', () => {
            $('#loading').fadeIn('fast', () => {
                fetch(ep.i + '/store/login?c=' + code, { method: 'POST',headers:ep.h }).then(res => res.json()).then(res => {
                    if (res.success) {
                        setCookie("session", res.session, 400)
                        window.location.href = "/store"
                    } else {
                        $('#loading').fadeOut('fast', () => {
                            $('#instruction_title').text('Anmeldung fehlgeschlagen')
                            $('#instruction_tuto').html('Der Code ist entweder abgelaufen oder wurde von unserem System nicht zuvor registriert. Bitte <strong>versuche</strong> es noch einmal mit /login.')
                            $('#instructables').fadeIn('fast')
                        })
                    }
                })
            });
        })
    }
})()