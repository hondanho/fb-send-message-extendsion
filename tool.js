try {
  window.onerror = function (msg, url, lineNo, columnNo, error) {
    var string = msg.toLowerCase();
    var substring = "script error";
    if (string.indexOf(substring) > -1){
      alert('Script Error: See Browser Console for Detail');
    } else {
      var message = [
        'Message: ' + msg,
        'URL: ' + url,
        'Line: ' + lineNo,
        'Column: ' + columnNo,
        'Error object: ' + JSON.stringify(error)
      ].join(' - ');

      alert(message);
    }

    return false;
  };
  main();
} catch (error) {
  console.log(error.message);
}

function main() {
  console.log("tool started!!!");
  let StopSendMessage = false;
  toastr.options = {
    closeButton: true,
    debug: false,
    newestOnTop: false,
    progressBar: true,
    positionClass: "toast-top-right",
    preventDuplicates: false,
    onclick: null,
    showDuration: "300",
    hideDuration: "1000",
    timeOut: "5000",
    extendedTimeOut: "1000",
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut",
  };

  const responseCode = {
    UnAuthenticate: 401,
    Success: 200,
    Error: 400
  };

  //var apiUrl = "http://localhost:3000/";
  var apiUrl = "https://fbpsm-api.phimdoc.online/";
  var getPagesApi = apiUrl + "pages";
  var getConversationsApi = apiUrl + "conversations";
  var sendMessageApi = apiUrl + "send-message";
  var uploadImageUrl = apiUrl + "upload-image";
  var ERROR_UNAUTHORIZED = "UNAUTHORIZED";
  var token;
  var myDropzone;

  function insertAtCaret(areaId, text) {
    var txtarea = document.getElementById(areaId);
    var scrollPos = txtarea.scrollTop;
    var strPos = 0;
    var br = ((txtarea.selectionStart || txtarea.selectionStart == '0') ?
      "ff" : (document.selection ? "ie" : false ) );
    if (br == "ie") {
      txtarea.focus();
      var range = document.selection.createRange();
      range.moveStart ('character', -txtarea.value.length);
      strPos = range.text.length;
    }
    else if (br == "ff") strPos = txtarea.selectionStart;

    var front = (txtarea.value).substring(0,strPos);
    var back = (txtarea.value).substring(strPos,txtarea.value.length);
    txtarea.value=front+text+back;
    strPos = strPos + text.length;
    if (br == "ie") {
      txtarea.focus();
      var range = document.selection.createRange();
      range.moveStart ('character', -txtarea.value.length);
      range.moveStart ('character', strPos);
      range.moveEnd ('character', 0);
      range.select();
    }
    else if (br == "ff") {
      txtarea.selectionStart = strPos;
      txtarea.selectionEnd = strPos;
      txtarea.focus();
    }
    txtarea.scrollTop = scrollPos;
  }

  function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  function templateToString(template, keys) {
    return template.replaceAll(/{{(!?)([^}]+)}}/gi, function(match, p1, p2, offset, str) {
      if (!!p1) {
        return match.replace(p1, '');
      } else {
        let strs = p2.split('|');
        let idx = getRndInteger(0, strs.length);
        let replaceValue = strs[idx];
        if (!!keys) {
          replaceValue = keys[replaceValue] || replaceValue;
        }
        return replaceValue;
        // return !keys ? strs[idx] : keys[strs[idx]] || strs[idx];
      }
    });
  }

  function ReLogin() {
    chrome.storage.local.clear(function () {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Lỗi xác thực, xin vui lòng thử lại!',
      });
      console.log("token cleared");
    });
  }

  function loadMaterialLoading() {
    console.log("material-loading.js v1.2");
    var ml = document.createElement("div");
    ml.id = "materialLoading";
    ml.className = "hide";
    var mlCentered = document.createElement("div");
    mlCentered.id = "materialLoadingCentered";
    var mlContent = document.createElement("div");
    mlContent.id = "materialLoadingContent";
    mlContent.innerHTML = '<div class="spinner-border text-primary"></div>';
    mlCentered.appendChild(mlContent);
    ml.appendChild(mlCentered);
    document.body.appendChild(ml);
    ml_ready = true;
    materialLoading(ml_state);
  }

  function loadDropzone(token) {
    Dropzone.autoDiscover = false;
    // Get the template HTML and remove it from the doument
    var previewNode = document.querySelector("#template");
    previewNode.id = "";
    var previewTemplate = previewNode.parentNode.innerHTML;
    previewNode.parentNode.removeChild(previewNode);

    myDropzone = new Dropzone(document.body, { // Make the whole body a dropzone
      url: uploadImageUrl + "?token=" + token, // Set the url
      acceptedFiles: '.png,.jpg',
      maxFiles: 3,
      maxfilesexceeded: function(file) {
        this.removeFile(file);
      },
      thumbnailWidth: 120,
      thumbnailHeight: 120,
      parallelUploads: 20,
      previewTemplate: previewTemplate,
      paramName: 'image_file', // MB
      init: function() {
        this.on("success", function(file, responseText, xhr) {
          if (xhr) {
            let res = responseText;
            if (typeof res === 'string') res = JSON.parse(res);
            if (res) {
              file.picturePath = res.data;
            }
          }
        });
        this.on("error", function(file, responseText, xhr) {
          if (xhr) {
            if (xhr.status === 401 || xhr.status === 403) {
              ReLogin();
            }
          }
        });
      },
      autoQueue: true, // Make sure the files aren't queued until manually added
      previewsContainer: "#previews", // Define the container to display the previews
      clickable: ".fileinput-button" // Define the element that should be used as click trigger to select files.
    });

    myDropzone.on("addedfile", function(file) {
      // Hookup the start button
      file.previewElement.querySelector(".start").onclick = function() { myDropzone.enqueueFile(file); };
    });

    // Update the total progress bar
    // myDropzone.on("totaluploadprogress", function(progress) {
    //   document.querySelector("#total-progress .progress-bar").style.width = progress + "%";
    // });

    myDropzone.on("sending", function(file) {
      // Show the total progress bar when upload starts
      //document.querySelector("#total-progress").style.opacity = "1";
      // And disable the start button
      file.previewElement.querySelector(".start").setAttribute("disabled", "disabled");
    });

    // Hide the total progress bar when nothing's uploading anymore
    myDropzone.on("queuecomplete", function(progress) {
      //document.querySelector("#total-progress").style.opacity = "0";
    });

    // Setup the buttons for all transfers
    // The "add files" button doesn't need to be setup because the config
    // `clickable` has already been specified.
    // document.querySelector("#actions .start").onclick = function() {
    //   myDropzone.enqueueFiles(myDropzone.getFilesWithStatus(Dropzone.ADDED));
    // };
    // document.querySelector("#actions .cancel").onclick = function() {
    //   myDropzone.removeAllFiles(true);
    // };

    // Now fake the file upload, since GitHub does not handle file uploads
    // and returns a 404

    var minSteps = 6,
        maxSteps = 60,
        timeBetweenSteps = 100,
        bytesPerStep = 100000;

    // myDropzone.uploadFiles = function(files) {
    //   var self = this;

    //   for (var i = 0; i < files.length; i++) {

    //     var file = files[i];
    //     totalSteps = Math.round(Math.min(maxSteps, Math.max(minSteps, file.size / bytesPerStep)));

    //     for (var step = 0; step < totalSteps; step++) {
    //       var duration = timeBetweenSteps * (step + 1);
    //       setTimeout(function(file, totalSteps, step) {
    //         return function() {
    //           file.upload = {
    //             progress: 100 * (step + 1) / totalSteps,
    //             total: file.size,
    //             bytesSent: (step + 1) * file.size / totalSteps
    //           };

    //           self.emit('uploadprogress', file, file.upload.progress, file.upload.bytesSent);
    //           if (file.upload.progress == 100) {
    //             file.status = Dropzone.SUCCESS;
    //             self.emit("success", file, 'success', null);
    //             self.emit("complete", file);
    //             self.processQueue();
    //           }
    //         };
    //       }(file, totalSteps, step), duration);
    //     }
    //   }
    // }
  }

  chrome.runtime.onMessage.addListener(receiver);

  function receiver(request, sender, sendResponse) {
    console.log(request.message);
    if (request.action === "start app") {
      window.stop();
      sendResponse({ farewell: "goodbye" });
      $.get(chrome.extension.getURL("tool.html"), function (html) {
        $("html").html(html);

        $('#insert-name').click(function() {
          insertAtCaret('message-content', '{{full_name}}');
        });
        $('#insert-random').click(function() {
          insertAtCaret('message-content', '{{Xin chào|Chào|Hi}}');
        });

        chrome.storage.local.get(["fbpsm_token"], function (result) {
          loadDropzone(result['fbpsm_token']);
        });
        loadMaterialLoading();

        function showLoading() {
          materialLoading(true);
        }

        function hideLoading() {
          materialLoading(false);
        }

        $("#btn-get-customers").click(function () {
          getCustomers();
        });

        $('#cb-check-all').click(function () {
          let checked = this.checked;
          $("#table-list-customer > tbody > tr").each(function () {
            $(this).find('input[type=checkbox]')[0].checked = checked;
          });
          let amountChecked = $('.checkbox-one:checked').length;
          $('#no-choosed-customers').html(amountChecked);
        });

        $("#btn-send-message").click(async function () {
          let timeInterval = $("#send-message-sleep").val();
          let listConvertation = $('.checkbox-one:checked');
          if (listConvertation && listConvertation.length > 0) {
            let listCustomers = [];
            listConvertation.each(function (idx, data) {
              let uid = data['id'].match(/cb\-(.*)/)[1];
              let fullName = $('#pn-' + uid).html();
              listCustomers.push({
                uid: uid,
                fullName: fullName
              });
              $('#status-' + uid).html('pending');
            });
            StopSendMessage = false;
            $('#btn-send-message').addClass('hide');
            $('#btn-stop-send-message').removeClass('hide');
            await sendMessages(listCustomers, parseInt(timeInterval));
            $('#btn-send-message').removeClass('hide');
            $('#btn-stop-send-message').addClass('hide');
          }
        });

        $("#btn-stop-send-message").click(async function () {
          Swal.fire({
            title: 'Bạn có muốn dừng gửi tin nhắn?',
            showDenyButton: false,
            showCancelButton: true,
            confirmButtonText: `Dừng gửi`,
            denyButtonText: `Don't save`,
          }).then((result) => {
            /* Read more about isConfirmed, isDenied below */
            if (result.isConfirmed) {
              StopSendMessage = true;
            }
          })
        });

        async function sendMessages(listCustomers, interval) {
          // get pageId
          let pageId = $('#list-pages').val();

          // get message
          let textMessage = $('#message-content').val();
          let pictures = [];
          // get pictures
          let files = myDropzone.files.filter(f => f.picturePath);
          pictures = files.map(f => f.picturePath);

          let total = listCustomers.length;
          let successCount = 0;
          let errorCount = 0;
          let sentPercent = 0.0;
          $('#send-message-stat #total').html(total);
          $('#send-message-progress-bar').addClass('progress-bar-animated');
          $('#send-message-progress-bar').html('');
          $('#send-message-progress-bar').attr('style', 'width: ' + sentPercent + '%;');
          $('#send-message-stat #success').html(successCount);
          $('#send-message-stat #error').html(errorCount);
          $('#send-message-stat #sent').html(0);

          for (let i = 0; i < listCustomers.length; i++) {
            let uid = listCustomers[i].uid;
            let fullName = listCustomers[i].fullName;
            try {
              $('#status-' + uid).html('Sending');
              sentPercent = (i + 0.3) * 100.0 / total;
              $('#send-message-progress-bar').html(sentPercent + '%');
              $('#send-message-progress-bar').attr('style', 'width: ' + sentPercent + '%;');

              let message = {
                textMessage: templateToString(textMessage, {
                  'full_name': fullName
                }),
                pictures: pictures
              }

              let sent = await sendMessage(uid, pageId, message);
              $('#status-' + uid).html('Message sent');
              successCount++;
              $('#send-message-stat #success').html(successCount);
            } catch (e) {
              errorCount++;
              $('#send-message-stat #error').html(errorCount);
              if (e.message === 'ReLogin') {
                ReLogin();
                return;
              }
              $('#status-' + uid).html('Send message error');
            } finally {
              $('#send-message-stat #sent').html(i + 1);
              sentPercent = (i + 1) * 100.0 / total;
              $('#send-message-progress-bar').html(sentPercent + '%');
              $('#send-message-progress-bar').attr('style', 'width: ' + sentPercent + '%;');
              if (i + 1 === total) {
                $('#send-message-progress-bar').removeClass('progress-bar-animated');
                break;
              }

              if (StopSendMessage) {
                $('#send-message-progress-bar').removeClass('progress-bar-animated');
                break;
              }

              await new Promise((res, rej) => {
                setTimeout(() => {
                  res('finish');
                }, interval);
              });
            }
          }
        }

        function sendMessage(partnerId, pageId, message) {
          return new Promise((resolve, reject) => {
            chrome.storage.local.get(["fbpsm_token"], function (result) {
              // check token
              if (result["fbpsm_token"]) {
                token = result["fbpsm_token"];
                $.ajax({
                  type: "POST",
                  url: sendMessageApi,
                  data: JSON.stringify({ token, partnerId, pageId, message }),
                  contentType: "application/json",
                  dataType: "json",
                })
                .done(function (response) {
                  if (response.error) {
                    if (error['code'] === ERROR_UNAUTHORIZED) {
                      reject(new Error('ReLogin'));
                    } else {
                      reject(new Error(error['message']));
                    }
                  } else {
                    let data = response.data;
                    resolve(data);
                  }
                })
                .fail(function (jqXHR) {
                  if (jqXHR.status === 401 || jqXHR.status === 403) {
                    reject(new Error('ReLogin'));
                  } else {
                    reject(new Error('Lỗi gửi tin nhắn'));
                  }
                });
              } else {
                reject(new Error('ReLogin'));
              }
            });
          });
        }

        function getCustomers() {
          chrome.storage.local.get(["fbpsm_token"], function (result) {
            // check token
            if (result["fbpsm_token"]) {
              token = result["fbpsm_token"];
              showLoading();

              let pageId = $("#list-pages").val();
              if (!pageId) {
                toastr["warning"]("Vui lòng chọn page");
                return;
              }
              $.ajax({
                type: "GET",
                url: getConversationsApi + "?token=" + token + "&pageId=" + pageId,
                contentType: "application/json",
                dataType: "json",
              })
              .done(function (response) {
                if (response.error) {
                  toastr["error"](response.error.message);
                  if (response.error.code === ERROR_UNAUTHORIZED) {
                    ReLogin();
                    return;
                  }
                } else {
                  let datas = response.data;
                  let listCustomers = "";
                  $("#table-list-customer tbody").html('');
                  $('#cb-check-all')[0].checked = false;
                  datas.forEach((data) => {
                    $("#table-list-customer tbody")
                      .append($('<tr>')
                        .append($('<td>')
                          .attr('class', 'col-1')
                          .append($('<input>')
                            .attr('type', 'checkbox')
                            .attr('class', 'checkbox-one')
                            .attr('id', 'cb-' + data.partnerId)
                          )
                        )
                        .append($('<td>')
                          .attr('class', 'col-4')
                          .html(data.partnerId)
                        )
                        .append($('<td>')
                          .attr('class', 'col-4')
                          .attr('id', 'pn-' + data.partnerId)
                          .html(data.partnerName)
                        )
                        .append($('<td>')
                          .attr('class', 'col-3 text-center')
                          .attr('id', 'status-' + data.partnerId)
                          .html('-')
                        )
                      );
                  });

                  let currentPageName = $('#list-pages > option[value="' + pageId + '"]').text();
                  $('#current-page').html(currentPageName);
                  $('#no-choosed-customers').html(0);
                  $('#no-all-customers').html(datas.length);

                  $('.checkbox-one').click(function () {
                    let amountChecked = $('.checkbox-one:checked').length;
                    let amountCheckbox = $('.checkbox-one').length;
                    $('#no-choosed-customers').html(amountChecked);
                    $('#cb-check-all')[0].checked = (amountCheckbox === amountChecked);
                  });
                }
              })
              .fail(function (jqXHR, textStatus, errorThrown) {
                if (jqXHR.status === 401 || jqXHR.status === 403) {
                  ReLogin();
                } else {
                  toastr["error"]("Lấy danh sách khách hàng lỗi.");
                }
              })
              .always(function() {
                hideLoading();
              });
            } else {
              ReLogin();
            }
          });
        }

        $("#btn-get-pages").click(function () {
          getPages();
        });

        function getPages() {
          chrome.storage.local.get(["fbpsm_token"], function (result) {
            // check token
            if (result["fbpsm_token"]) {
              token = result["fbpsm_token"];
              showLoading();

              $.ajax({
                type: "GET",
                url: getPagesApi + "?token=" + token,
                contentType: "application/json",
                dataType: "json",
              })
              .done(function (response) {
                if (response.error) {
                  toastr["error"](response.error.message);
                  if (response.error.code === ERROR_UNAUTHORIZED) {
                    ReLogin();
                    return;
                  }
                } else {
                  let datas = response.data;
                  $("#list-pages").html("");
                  if (datas) {
                    datas.forEach((data) => {
                      $("#list-pages").append(
                        new Option(data.pageName, data.pageId)
                      );
                    });
                    $("#btn-get-customers").parent().removeClass("hide");
                  }
                }
              })
              .fail(function (jqXHR, textStatus, errorThrown) {
                if (jqXHR.status === 401 || jqXHR.status === 403) {
                  ReLogin();
                } else {
                  toastr["error"]("Lấy danh sách pages lỗi.");
                }
              })
              .always(hideLoading);
            } else {
              ReLogin();
            }
          });
        }
      });
    }
  }
}