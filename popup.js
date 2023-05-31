function getCookie(content) {
  document.getElementById('cookie').innerHTML = content;
}

$(function() {
  toastr.options = {
    "closeButton": true,
    "debug": false,
    "newestOnTop": false,
    "progressBar": true,
    "positionClass": "toast-bottom-right",
    "preventDuplicates": false,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "5000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
  };
  let fbUrl = 'https://www.facebook.com/';
  let fbUrlReg = /facebook.com/gi;
  let loginApi = 'https://fbpsm-api.phimdoc.online/login';
  //let loginApi = 'http://localhost:3000/login';

  let cookies = [];
  let activeTab;
  // kiểm tra xem có phải trang facebook không
  let params = {
    active: true,
    currentWindow: true
  };
  chrome.tabs.query(params, gotTabs);

  function gotTabs(tabs) {
    let tab = tabs[0];
    activeTab = tab;
    if (!fbUrlReg.test(tab.url)) {
      $('#goFacebook').addClass('active');
    } else {
      chrome.cookies.getAll({
        url: fbUrl
      }, function(cks) {
        cookies = cks;
        if (!cks || cks.length <= 0) {
          $('#loginFacebook').addClass('active');
        } else {
          let cUserCookie = cks.find(c => c['name'] === 'c_user');
          if (!cUserCookie ||
              cUserCookie['value'] === undefined ||
              cUserCookie['value'] === null ||
              cUserCookie['value'] === '') {

            $('#loginFacebook').addClass('active');
            // chrome.storage.local.clear(function() {
            //   $('#loginFacebook').addClass('active');
            // });
          } else {
            $('#startTool').addClass('active');
          }
        }
      });
    }
  }

  $('#startTool #start').click(function() {
    chrome.storage.local.get(['fbpsm_token', 'c_user', 'c_user_expire'], function(result) {
      let c_userCookie = cookies.find(function(c) {
        return c['name'] === 'c_user';
      });
      if (!result['fbpsm_token'] ||
          result['c_user'] != c_userCookie['value'] ||
          result['c_user_expire'] != c_userCookie['expirationDate']) {
        loginApp(result['fbpsm_token'], function() {
          startTool();
        });
      } else {
        startTool();
      }
    });
  });

  function loginApp(token, callback) {
    $('#startTool').addClass('none');
    $('#div-copy-loader').removeClass('none');
    var loggingIn = $.ajax({
      type: 'POST',
      url: loginApi,
      data: JSON.stringify({ token, cookies }),
      contentType: "application/json",
      dataType: 'json'
    });
    loggingIn.done(function(response) {
      if (response.error) {
        toastr["error"](response.error.message);
      } else {
        let data = response.data;
        chrome.storage.local.set({
          'fbpsm_token': data.token,
          'c_user': data.c_user,
          'c_user_expire': data.c_user_expire
        }, function() {
          toastr["success"]("Đăng nhập tool thành công");
          if (callback) callback();
        });
      }
    }).fail(function (jqXHR) {
      if (jqXHR.status === 401 || jqXHR.status === 403) {
        toastr["error"]("Tài khoản facebook này không có quyền truy cập tool");
      } else {
        toastr["error"]("Đăng nhập tool lỗi, vui lòng thử lại");
      }
    }).always(function() {
      $('#startTool').removeClass('none');
      $('#div-copy-loader').addClass('none');
    });
  }

  function startTool() {

    if (/http(s?):\/\/m.facebook.com(\/?)/.test(activeTab.url)) {
      loadToolUI();
    } else {
      chrome.tabs.update(activeTab.id, {url: 'https://m.facebook.com/'}, function() {
        chrome.tabs.onUpdated.addListener(function (tabId, changeInfom, tab) {
          if (tab.status == "complete") {
            loadToolUI();
          }
        });
      });
    }

  }

  function loadToolUI() {
    chrome.tabs.sendMessage(activeTab.id, {
      "message": "browser action",
      "action": "start app"
    }, function(res) {
      if (res.farewell === "goodbye") {
        window.close();
      }
    });
  }


  // document.getElementById('btnGetCookie').addEventListener('click', () => {
  //   chrome.cookies.getAll({
  //     url: 'https://facebook.com/'
  //   }, function(cookies) {
  //     getCookie(JSON.stringify(cookies));
  //     chrome.extension.getBackgroundPage().console.log(cookies);
  //   });
  // });
});