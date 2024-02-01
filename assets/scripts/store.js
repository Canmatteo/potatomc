(async () => {
    const ep = await getEndpointIp();
    const session = getCookie('session');

    async function validateSession(session) {
        return await fetch(ep.i + '/store/is_valid', {
            method: 'POST',
            headers: {
                session,
                ...ep.h
            }
        }).then(res => res.json()).then(res => {
            return res?.isValid || false;
        }).catch(() => {
            return false;
        })
    }

    async function getArticles() {
        return await fetch(ep.i + '/store/articles', {
            method: 'POST',
            headers: {
                session,
                ...ep.h
            }
        }).then(res => res.json()).then(res => {
            return res
        })
    }

    async function getProfile() {
        return await fetch(ep.i + '/store/profile', {
            method: 'POST',
            headers: {
                session,
                ...ep.h
            }
        }).then(res => res.json()).then(res => {
            return res
        })
    }

    function parseObjectsInArray(array) {
        var new_array = new Array();
        array.forEach(obj => {
            new_array.push(JSON.parse(obj))
        })
        return new_array;
    }

    //a_id: article id
    //mc: max count
    //dm: display name
    //rt: run time
    //p: price
    //c: color
    function addToCart(a_id, mc, dm, rt, p, c) {
        var cart = JSON.parse(getCookie('cart') || "[]");
        console.log('previous cart was:', cart);

        console.log('max count:', mc)
        const includes = parseObjectsInArray(cart).filter(a => a.a_id === a_id)?.[0];
        console.log('includes:', includes)
        if (mc < 2 && includes) return new SnackBar({
            status: "danger",
            icon: "warn",
            message: "Dieser Artikel kann nur einmal in den Warenkorb hinzugefügt werden!",
            fixed: true
        })

        console.log('adding article with id:', a_id);

        cart.push(JSON.stringify({ a_id, dm, rt, p, c }));

        updateCartDropdown(cart)
        cart = JSON.stringify(cart);
        console.log('setting new cart:', cart);
        setCookie('cart', cart, 400)

        new SnackBar({
            status: "success",
            icon: "✔️",
            message: "Der Artikel " + dm + ' wurde deinem Warenkorb hinzugefügt!',
            fixed: true
        })
    }

    function cartRemoveArticle(a_id) {
        var cart = JSON.parse(getCookie('cart') || "[]");
        console.log('previous cart was:', cart);

        const i = JSON.parse(cart.filter(a => JSON.parse(a).a_id === a_id)[0])
        console.log(i)
        cart = cart.filter(a => JSON.parse(a).a_id !== a_id)
        console.log('removed article with id:', a_id, 'from cart:', cart)

        console.log('changing cart to:', cart)
        setCookie('cart', JSON.stringify(cart), 400)
        updateCartDropdown(cart)
        if ($('#checkout').is(':visible')) cartCheckout();

        new SnackBar({
            status: "success",
            icon: "✔️",
            message: "Der Artikel " + i.dm + ' wurde aus deinem Warenkorb entfernt!',
            fixed: true
        })
    }

    function updateCartDropdown(cart) {
        console.log('updating cart dropdown to:', cart)

        $('#cart_dd_articles_count').text(cart.length)

        const ul = $('#cart_dd_articles');
        const is_e = cart.length <= 0;
        ul.html(is_e ? '<p class="text-danger">Keine Artikel im Warenkorb</p>' : '')
        const c_btn = $('#cart_go_to_checkout')
        if (is_e) { return c_btn.addClass('disabled') } else { c_btn.removeClass('disabled') };

        cart.forEach((article_raw, i) => {

            const a = JSON.parse(article_raw);

            const el = $(`
            <li class="row m-0 me-2">
            <p class="col" style="color:${a.c};">${a.dm}</p>
            <button type="button" class="col btn btn-danger btn-sm p-0" id="delete_article_${a.a_id}"><i class="bi bi-trash3"></i></button>
            </li>
            `)

            ul.append(el)

            $(`#delete_article_${a.a_id}`).click(function () { cartRemoveArticle(a.a_id) })

            const d = $('<li><hr class="dropdown-divider"></li>')
            if (cart.length != i + 1) ul.append(d)
        })
    }

    function cartCheckout() {
        $('#store').fadeOut('fast', () => {
            $('#checkout_articles').html('')
            var sum = 0;
            JSON.parse(getCookie('cart')).forEach((article_raw, i) => {
                const a = JSON.parse(article_raw);
                console.log('building checkout element with:', a)

                const el = $(`        <tr>
                <th scope="row">${i + 1}</th>
                <td><span style="color:${a.c}";>${a.dm}</span></td>
                <td>${a.p} <img src="/assets/image/potato.png" width="16"></td>
                <td>${a.rt} Tag${a.rt != 1 ? 'e' : ''}</td>
              </tr>
              `)
                $('#checkout_articles').append(el)
                sum += a.p
            })
            $('#checkout_sum').text(sum)
            $('#checkout').fadeIn('fast')
        })
    }

    function cartCheckoutConfirmed() {
        $('#checkout_confirm_loading').fadeIn('fast')

        cartBuy(getCookie('cart')).then(() => {
            $('#checkout_confirm_loading').fadeOut('fast', () => {
                $('#checkout').fadeOut('fast', () => {
                    $('#store').fadeIn('fast')
                })
            })
            new SnackBar({
                status: "success",
                icon: "✔️",
                message: 'Artikel erfolgreich gekauft!',
                fixed: true
            })
        }).catch(error => {
            $('#checkout_confirm_loading').fadeOut('fast', () => {
                $('#checkout').fadeOut('fast', () => {
                    $('#store').fadeIn('fast')
                })
            })
            new SnackBar({
                status: "danger",
                icon: "warn",
                message: error,
                fixed: true
            })
        })
    }

    function cartBuy(articles) {
        console.log('buying:', articles)
        return new Promise((resolve, reject) => {
            fetch(ep.i + '/store/transactions/buy', { method: 'POST', headers: { session, articles, ...ep.h } }).then(res => res.json()).then(res => {
                if (res.success) {
                    updateProfile()
                    clearCart()
                    resolve()
                } else {
                    reject(res.error || 'Ein unerwarteter Fehler ist aufgetreten!')
                }
            })
        })
    }

    function clearCart() {
        setCookie('cart', JSON.stringify([]), 400);
        updateCartDropdown();
    }

    function updateProfile() {
        getProfile().then(async profile => {
            console.log('got profile', profile)
            $('#profile_username').html(`
            <img src="${profile.avatar}" width="20">
            ${profile.un}`)
            $('#profile_balance').text(profile.balance)
            if (profile.rank != 'default') {
                const rank = (await getArticle(profile.rank));
                $('#profile_rank').text(rank.name)
                $('#profile_rank').css('color', rank.color)
            }
            const ph = profile.playtime_hours.now; //2
            const phg = profile.playtime_hours.gifted //1
            $('#profile_playtime').text(moment.duration(ph, 'hours').locale('de').humanize())
            console.log(60-60*(ph-phg))
            $('#profile_playtime_gift_left').text(moment.duration(60-60*(ph-phg), 'minutes').locale('de').humanize(true))
        })
    }

    async function getArticle(a_id) {
        return getArticles().then(articles => {
            return articles.filter(a => a.id === a_id)[0]
        })
    }

    $(document).ready(async () => {
        $('#cart_go_to_checkout').click(function () { cartCheckout() })
        $('#checkout_confirm').click(function () { cartCheckoutConfirmed() })
        console.log('checking for valid session')
        if (session && await validateSession(session)) {
            console.log('session is valid')
            updateCartDropdown(JSON.parse(getCookie('cart') || '[]'))
            getArticles().then(articles => {
                articles.forEach(article => {
                    const i = $(`
                    <div class="col-sm ms-3 card bg-transparent blur-bg">
                    <div class="row g-0 align-items-center">
                      <div class="col-md-4">
                        <img src="${article.img}" class="img-fluid">
                      </div>
                      <div class="col-md-8">
                        <div class="card-body">
                          <h5 class="card-title"><span style="color:${article.color};">${article.name}</span> (${article.run_time} Tag${article.run_time != 1 ? 'e' : ''})</h5>
                          <small class="card-text">${article.description}</small>
                          <hr>
                          <p class="card-text"><p class="text-warning">Preis: <strong>${shortNumber(article.price)} <img src="/assets/image/potato.png" width="20"></strong></p></p>
                          <button class="btn btn-warning" id="add_to_cart_${article.id}"><i class="bi bi-bag-plus-fill"></i> In den Warenkorb</button>
                        </div>
                      </div>
                    </div>
                  </div>
                    `)
                    $('#articles').append(i)
                    $(`#add_to_cart_${article.id}`).click(function () { addToCart(article.id, article.max_count, article.name, article.run_time, article.price, article.color) })
                });
            })
            updateProfile()
            $('#loading').fadeOut('fast', () => {
                $('#store').fadeIn('fast')
            })
        } else {
            window.location.href = "/login";
        }
    })
})()