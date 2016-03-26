$(document).ready(function () {
    $(window).trigger('hashchange');
    var authorid = $('h1.page-title').attr('data-authorid');
    var authorimg = $('h1.page-title').attr('data-authorimg');
    //$('#banner').css('background-image', 'url(' + WEBDIR + 'headphones/GetThumb/?url=' + authorimg + ')'); // encodeURIComponent should resize img?
    $('#author-tracks .search-author-hp').click(function () {
        var $parentRow = $(this).parents('tr')
        var authorId = $parentRow.attr('data-authorid');
        var name = $(this).parents('tr').find('.author').text();
        searchForAuthor(authorId, name);
    })
    $('#author-tracks .trynew-author-hp').click(function () {
        var $parentRow = $(this).parents('tr')
        var authorId = $parentRow.attr('data-authorid');
        var name = $(this).parents('tr').find('.author').text();
        searchForNewDownload(authorId, name);
    })
    $('#author-tracks .unque-author-hp').click(function () {
        var $parentRow = $(this).parents('tr')
        var authorId = $parentRow.attr('data-authorid');
        var name = $(this).parents('tr').find('.author').text();
        unqueauthor(authorId, name);
    })
    //Sort authors table on author type
    $('.authors-table').trigger("sorton",[[[1,0]]]);
    console.log(authorimg);
    if(authorimg == "None") {
        $('.author_img').attr('src', WEBDIR + 'img/no-cover-art.png')
     } else {
        $('.author_img').attr('src', WEBDIR + 'headphones/GetThumb?url=' + encodeURIComponent(authorimg))
     }

});

function searchForAuthor(authorId, name) {
    var modalcontent = $('<div>');
    modalcontent.append($('<p>').html('Looking for author &quot;'+ name +'&quot;.'));
    modalcontent.append($('<div>').html('<div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div>'));
    showModal('Searching for author "'+ name + '"', modalcontent, {});

    $.ajax({
        url: WEBDIR + 'headphones/QueueAuthor?authorId=' + authorId,
        type: 'get',
        dataType: 'json',
        timeout: 40000,
        success: function (data) {
            notify('OK', 'Found ' + name + ' author', 'success');
        },
        error: function (data) {
            notify('Error', 'Author not found.', 'error', 1);
        },
        complete: function (data) {
            hideModal();
            // Hate the reload but content is rendered from mako
            location.reload()
        }
    });
}

function searchForNewDownload(authorId, name) {
    var modalcontent = $('<div>');
    modalcontent.append($('<p>').html('Looking for author &quot;'+ name +'&quot;.'));
    modalcontent.append($('<div>').html('<div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div>'));
    showModal('Searching for new author download "'+ name + '"', modalcontent, {});

    $.ajax({
        url: WEBDIR + 'headphones/QueueAuthor',
        data: {
			'authorId': authorId,
			'new': 'True'
			},
        type: 'get',
        dataType: 'json',
        timeout: 40000,
        success: function (data) {
            notify('OK', 'Found ' + name + ' author', 'success');
        },
        error: function (data) {
            notify('Error', 'Author not found.', 'error', 1);
        },
        complete: function (data) {
            hideModal();
            // Hate the reload but content is rendered from mako
            location.reload()
        }
    });
}

function unqueauthor(authorid, name) {
    $.ajax({
        url: WEBDIR + 'headphones/UnqueueAuthor',
        data: {
            'authorId': authorid
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
