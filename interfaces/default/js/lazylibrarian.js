$(document).ready(function () {
    $(window).trigger('hashchange');
    loadAuthors();
    loadBooks();
    loadWanteds();
    loadHistory();

    var searchAction = function () {
        var query = $('#add_author_name').val();
        if (query) {
            $('#add_author_button').attr('disabled', true);
            searchForAuthor(query, $('#add_author_book').find('option:selected').val());
        }
    };

    $('#add_author_name').keyup(function(event){
        if(event.keyCode == 13){
            searchAction();
        }
    });

    $('#add_author_button').click(function () {
        searchAction();
        $(this).attr('disabled', true);
        //searchForAuthor($('#add_author_name').val(), $('#add_author_book').find('option:selected').val());
    });

    $('#add_authorid_button').click(function () {
        addAuthor($('#add_author_select').val(), $('#add_author_book').find('option:selected').val(), $('#add_author_select').find('option:selected').text())

    });

    $('#cancel_author_button').click(function () {
        cancelAddAuthor();
    });

    $('.lazylibrarian_forceprocess').click(function(e) {
        e.preventDefault();
        Postprocess();
    })
    
});

function beginRefreshAuthor(authorId) {
    var $div = $('div').html('Refreshing author');
    var $buttons = {
        'Refresh': function () {
            beginRefreshAuthor(authorId);
        }
    }

    showModal('Refresh author?', $div, $buttons);
}

function refreshAuthor(authorId) {

    $.ajax({
        url: WEBDIR + 'lazylibrarian/RefreshAuthor',
        type: 'post',
        data: {'authorId': authorId},
        dataType: 'json',
        success: function (result) {

        },
        error: function (req) {
            console.log('error refreshing author');
        }
    })
}

function searchForAuthor(name, type) {
    console.log("Searching for: " + name + " (" + type + ")");
    $.ajax({
        url: WEBDIR + 'lazylibrarian/SearchForAuthor',
        type: 'get',
        data: {'name': name,
                'searchtype': type},
        dataType: 'json',
        timeout: 40000,
        success: function (result) {
            if (!result || result.length === 0) {
                $('#add_author_button').attr('disabled', false);
                return;
            }
            // remove any old search
            $('#add_author_select').html('');

            if (type == 'authorId') {
                $.each(result, function (index, item) {
                    var option = $('<option>')
                    .attr('value', item.authorname)
                    .html(item.authorname);

                    $('#add_author_select').append(option);
                });

            } else {
                $.each(result, function (index, item) {
                    var tt;
                    if (item.bookdate.length) {
                        // release date should be (yyyy) or empty string
                        tt = ' (' + item.bookdate.substring(0,4) + ') '
                    } else {
                        tt = '  '
                    }
                    // item.uniquename == Author name
                    if (item.authorname === 'None') {
                        // to remove None..
                        item.authorname = ''
                    }
                    var option = $('<option>')
                        .attr('value', item.bookid)
                        .html(item.bookname + tt + item.authorname);

                    $('#add_author_select').append(option);
                });
            }
            $('#add_author_name').hide();
            $('#cancel_author_button').show();
            $('#add_author_select').fadeIn();
            $('#add_author_button').attr('disabled', false).hide();
            $('#add_authorid_button').show();
        }
    })
}

function addAuthor(id, searchtype, name) {
    // val can be authorId or bookId
    var stype = (searchtype === 'authorId') ? 'Author' : 'Book';
    $.ajax({
        url: WEBDIR + 'lazylibrarian/AddAuthor',
        data: {'id': id,
               'searchtype': searchtype},
        type: 'get',
        dataType: 'text',
        success: function (data) {
            $('#add_author_name').val('');
            notify('Add ' + stype, 'Successfully added  '+ stype + ' ' + name, 'success');
            cancelAddAuthor();
        }
    })
}

function cancelAddAuthor() {
    $('#add_author_select').hide();
    $('#cancel_author_button').hide();
    $('#add_author_name').fadeIn();
    $('#add_authorid_button').hide();
    $('#add_author_button').show();
}

function loadAuthors() {
    $.ajax({
        url: WEBDIR + 'lazylibrarian/GetAuthorList',
        type: 'get',
        dataType: 'json',
        success: function (result) {
            if (result.length == 0) {
                var row = $('<tr>')
                row.append($('<td>').attr('colspan', '5').html('No authors found'));
                $('#authors_table_body').append(row);
            } else {
                $.each(result, function (index, author) {
                    var image = $('<img>').addClass('img-polaroid img-rounded authorimgtab')
                    var name = $('<a>')
                        .attr('href',WEBDIR + 'lazylibrarian/viewAuthor/' + author.AuthorID)
                        .text(author.AuthorName);
                    var bookname = $('<a>')
                        .attr('href', author.LastLink)
                        .attr('target',"_blank")
                        .text(author.LastBook);
                    var row = $('<tr>')

                    var isError = author.AuthorName.indexOf('Fetch failed') != -1;
                    if (isError) {
                        author.Status = 'Error';
                    }

                    var $statusRow = $('<td>')
                        .html(lazylibrarianStatusLabel(author.Status));

                    if (isError) {
                        $statusRow.click(function () {
                            beginRefreshAuthor(author.AuthorID);
                        });
                    }

                    if (author.AuthorImg) {
                        image.attr('src', WEBDIR + 'lazylibrarian/GetThumb?thumb=' + author.AuthorImg)

                    } else {
                        image.attr('src', '../img/no-cover-author.png').css({'width' : '64px' , 'height' : '64px'}) //TODO

                    }

                    var div = $('<div>').addClass("authorthumbdiv").append(image)
                    row.append(
                        $('<td>').append(div),
                        $('<td>').html(name),
                        $('<td>').html(bookname),
                        $('<td>').append(author.LastDate),
                        $statusRow
                    );
                    $('#authors_table_body').append(row);
                });
                $('#authors_table_body').parent().trigger('update');
                $('#authors_table_body').parent().trigger("sorton",[[[0,0]]]);
            }
        }
    });
}

function loadBooks() {
    $.ajax({
        url: WEBDIR + 'lazylibrarian/GetBookList',
        type: 'get',
        dataType: 'json',
        success: function (result) {
            if (result.length == 0) {
                var row = $('<tr>')
                row.append($('<td>').attr('colspan', '5').html('No books found'));
                $('#books_table_body').append(row);
            } else {
                $.each(result, function (index, book) {
                    var image = $('<img>').addClass('img-polaroid img-rounded bookimgtab')
                    var name = $('<a>')
                        .attr('href', book.BookLink)
                        .attr('target',"_blank")
                        .text(book.BookName);
                    var authorname = $('<a>')
                        .attr('href',WEBDIR + 'lazylibrarian/viewAuthor/' + book.AuthorID)
                        .text(book.AuthorName);
                    var row = $('<tr>')

                    var isError = book.BookName.indexOf('Fetch failed') != -1;
                    if (isError) {
                        book.Status = 'Error';
                    }

                    var $statusRow = $('<td>')
                        .html(lazylibrarianStatusLabel(book.Status));

                    if (isError) {
                        $statusRow.click(function () {
                            beginRefreshBook(book.BookID);
                        });
                    }

                    if (book.BookImg) {
                        image.attr('src', WEBDIR + 'lazylibrarian/GetThumb?thumb=' + book.BookImg)

                    } else {
                        image.attr('src', '../img/no-cover-book.png').css({'width' : '64px' , 'height' : '64px'}) //TODO

                    }

                    var div = $('<div>').addClass("bookthumbdiv").append(image)
                    row.append(
                        $('<td>').append(div),
                        $('<td>').html(name),
                        $('<td>').html(authorname),
                        $('<td>').append(book.BookDate),
                        $statusRow
                    );
                    $('#books_table_body').append(row);
                });
                $('#books_table_body').parent().trigger('update');
                $('#books_table_body').parent().trigger("sorton",[[[0,0]]]);
            }
        }
    });
}

function loadWanteds() {
    // Clear it incase off reload
    $('#wanted_table_body').empty();
    $.ajax({
        url: WEBDIR + 'lazylibrarian/GetWantedList',
        type: 'get',
        dataType: 'json',
        success: function (result) {
            if (result.length == 0) {
                var row = $('<tr>')
                row.append($('<td>').attr('colspan', '5').html('No wanted books found'));
                $('#wanted_table_body').append(row);
            } else {
                $.each(result, function (index, wanted) {
                    var row = $('<tr>');
                    var image = $('<img>').addClass('img-polaroid img-rounded')
                    if (wanted.ThumbURL) {
                        image.attr('src', WEBDIR + 'lazylibrarian/GetThumb?w=150&h=150&thumb=' + encodeURIComponent(wanted.BookImg))

                    } else {
                        image.attr('src', '../img/no-cover-author.png').css({'width' : '75px' , 'height' : '75px'})
                    }

                    var remove = $('<a class="btn btn-mini btn-cancel" title="Set skipped"><i class="fa fa-step-forward"></i></a></td>').click(function () {
                                $.ajax({
                                    url: WEBDIR + 'lazylibrarian/UnqueueBook',
                                    data: {'bookId': wanted.BookID},
                                    type: 'get',
                                    complete: function (result) {
                                        loadWanteds()
                                        notify('Skipped', wanted.AuthorName + ' - ' + wanted.BookTitle, 'success');
                                    }
                                })
                            })
                    var force = $('<a class="btn btn-mini" title="Force search"><i class="fa fa-search"></i></a></td>').click(function () {
                                $.ajax({
                                    url: WEBDIR + 'lazylibrarian/QueueBook',
                                    data: {'bookId': wanted.BookID},
                                    type: 'get',
                                    complete: function (result) {
                                    	loadWanteds()
                                        notify('Force search for', wanted.AuthorName + ' - ' + wanted.BookTitle, 'success');
                                    }
                                })
                            })

                    var div = $('<div>').addClass('btn-group').append(force, remove);
                    row.append(
                        $('<td>').append(
                            $('<a>')
                                .addClass('lazylibrarian_wanted_authorname')
                                .attr('href', WEBDIR + 'lazylibrarian/viewAuthor/' + wanted.AuthorID)
                                .text(wanted.AuthorName)),
                        $('<td>').append(
                            $('<a>')
                                .addClass('lazylibrarian_wanted_authorbook')
                                .attr('href', wanted.BookLink)
                                .attr('target',"_blank")
                                .text(wanted.BookName)),
                        $('<td>').text(wanted.BookDate),
                        $('<td>').append(lazylibrarianStatusLabel(wanted.Status)),
                        $('<td>').append(div)

                    );
                    $('#wanted_table_body').append(row);
                });
                $('#wanted_table_body').parent().trigger('update');
                // Sort on release date, latest releases on top
                $('#wanted_table_body').parent().trigger("sorton",[[[2,1]]]);
            }
        }
    })
}

function loadHistory() {
    $.ajax({
        url: WEBDIR + 'lazylibrarian/GetHistoryList',
        type: 'get',
        dataType: 'json',
        success: function(result) {
            if (result.length == 0) {
                var row = $('<tr>')
                row.append($('<td>').attr('colspan', '5').html('History is empty'));
                $('#history_table_body').append(row);
            }
            $.each(result, function(i, item) {
                var row = $('<tr>');
                var retry = $('<a class="btn btn-mini" title="Try new download, if available"><i class="fa fa-repeat"></i></a></td>').click(function () {
                            $.ajax({
                                url: WEBDIR + 'lazylibrarian/QueueBook',
                                data: {
				'bookID': item.BookID,
				'new': 'True'
				},
                                type: 'get',
                                complete: function (result) {
                                    notify('Try new download, if available', 'success');
                                }
                            })
                        })
		if (item.Status == 'Snatched') {
		var div = $('<div>').addClass('btn-group').append(retry);
		} else if (item.Status == 'Unprocessed') {
		var div = $('<div>').addClass('btn-group').append(retry);
		} else {
		var div = ''
		}
                row.append(
                    $('<td>').html(item.NZBdate),
                    $('<td>').html(item.NZBtitle),
                    $('<td>').html(lazylibrarianStatusLabel(item.Status)),
                    $('<td>').append(div)
                );
                $('#history_table_body').append(row);
            });
        }
    });
}

function lazylibrarianStatusLabel(text) {
    var statusOK = ['Active', 'Downloaded', 'Processed'];
    var statusInfo = ['Wanted'];
    var statusError = ['Paused', 'Unprocessed'];
    var statusWarning = ['Snatched'];

    var label = $('<span>').addClass('label').text(text);

    if (statusOK.indexOf(text) != -1) {
        label.addClass('label-success');
    } else if (statusInfo.indexOf(text) != -1) {
        label.addClass('label-info');
    } else if (statusError.indexOf(text) != -1) {
        label.addClass('label-important');
    } else if (statusWarning.indexOf(text) != -1) {
        label.addClass('label-warning');
    }

    var icon = lazylibrarianStatusIcon(text, true);
    if (icon !== '') {
        label.prepend(' ').prepend(icon);
    }
    return label;
}


var lazylibrarianStatusMap = {
    'Active': 'fa fa-repeat',
    'Error': 'fa fa-bell',
    'Paused': 'fa fa-pause',
    'Snatched': 'fa fa-share-alt',
    'Skipped': 'fa fa-fast-forward',
    'Wanted': 'fa fa-heart',
    'Processed': 'fa fa-check',
    'Unprocessed': 'fa fa-exclamation'
}
function lazylibrarianStatusIcon(iconText, white){
    var iconClass = lazylibrarianStatusMap[iconText];

    if (typeof iconClass == 'undefined') {
        return;
    }

    var icon = $('<i>').addClass(iconClass);

    if (white == true) {
        icon.addClass('fa- fa-inverse');
    }
    return icon;
}

function Postprocess() {
    var data = {};
    p = prompt('Write path to processfolder or leave blank for default path');
    if (p || p.length >= 0) {
        data.dir = p;

        $.get(WEBDIR + 'lazylibrarian/ForceProcess', data, function(r) {
            state = (r.length) ? 'success' : 'error';
            // Stop the notify from firing on cancel
            if (p !== null) {
                path = (p.length === 0) ? 'Default folder' : p;
                notify('Lazylibrarian', 'Postprocess ' + path, state);
            }
        });

    }
}
