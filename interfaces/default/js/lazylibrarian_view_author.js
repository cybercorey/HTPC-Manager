$(document).ready(function () {
    console.log("Loaded");
    $(window).trigger('hashchange');
    var authorid = $('h1.page-title').attr('data-authorid');
    var authorimg = $('h1.page-title').attr('data-authorimg');
    //$('#banner').css('background-image', 'url(' + WEBDIR + 'lazylibrarian/GetThumb/?url=' + authorimg + ')'); // encodeURIComponent should resize img?
    $('#author-books .search-book-ll').click(function () {
        var $parentRow = $(this).parents('tr')
        var bookId = $parentRow.attr('data-bookid');
        var name = $(this).parents('tr').find('.book').text();
        searchForBook(bookId, name);
    })
    // $('#author-books .trynew-book-ll').click(function () {
    //     var $parentRow = $(this).parents('tr')
    //     var bookId = $parentRow.attr('data-bookid');
    //     var name = $(this).parents('tr').find('.book').text();
    //     searchForNewDownload(authorId, name);
    // })
    $('#author-books .unque-book-ll').click(function () {
        var $parentRow = $(this).parents('tr')
        var bookId = $parentRow.attr('data-bookid');
        var name = $(this).parents('tr').find('.book').text();
        unquebook(bookId, name);
    })
    //Sort authors table on author type
    $('.authors-table').trigger("sorton",[[[1,0]]]);
    console.log(authorimg);
    if(authorimg == "None") {
        $('.author_img').attr('src', WEBDIR + 'img/no-cover-art.png')
     } else {
        $('.author_img').attr('src', WEBDIR + 'lazylibrarian/GetThumb?url=' + encodeURIComponent(authorimg))
     }

});

function searchForBook(bookId, name) {
    var modalcontent = $('<div>');
    modalcontent.append($('<p>').html('Looking for book &quot;'+ name +'&quot;.'));
    modalcontent.append($('<div>').html('<div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div>'));
    showModal('Searching for book "'+ name + '"', modalcontent, {});

    $.ajax({
        url: WEBDIR + 'lazylibrarian/QueueBook?bookId=' + bookId,
        type: 'get',
        dataType: 'text',
        timeout: 40000,
        success: function (data) {
            notify('OK', 'Found ' + name + ' book', 'success');
        },
        error: function (data) {
            notify('Error', 'book not found.', 'error', 1);
            console.log(data);
        },
        complete: function (data) {
            hideModal();
            // Hate the reload but content is rendered from mako
            location.reload()
        }
    });
}

// function searchForNewDownload(authorId, name) {
//     var modalcontent = $('<div>');
//     modalcontent.append($('<p>').html('Looking for author &quot;'+ name +'&quot;.'));
//     modalcontent.append($('<div>').html('<div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div>'));
//     showModal('Searching for new author download "'+ name + '"', modalcontent, {});

//     $.ajax({
//         url: WEBDIR + 'lazylibrarian/QueueAuthor',
//         data: {
// 			'authorId': authorId,
// 			'new': 'True'
// 			},
//         type: 'get',
//         dataType: 'json',
//         timeout: 40000,
//         success: function (data) {
//             notify('OK', 'Found ' + name + ' author', 'success');
//         },
//         error: function (data) {
//             notify('Error', 'Author not found.', 'error', 1);
//         },
//         complete: function (data) {
//             hideModal();
//             // Hate the reload but content is rendered from mako
//             location.reload()
//         }
//     });
// }

function unquebook(bookId, name) {
    $.ajax({
        url: WEBDIR + 'lazylibrarian/UnqueueBook',
        data: {
            'bookId': bookId
        },
        type: 'get',
        success: function (result) {
            if (result === "OK") {
                notify('OK', 'Unqued ' + name + ' author', 'success');
                location.reload();

            } else {
                notify('Error', 'Unqued ' + name + ' author', 'error', 1);
            }
        }

    });
}
