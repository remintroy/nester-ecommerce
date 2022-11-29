const imgFiles = {};

// // start editing
// function cropperJS(id, btn, key) {
//   const img = document.getElementById(id);
//   window[id] = new Cropper(img, {
//     aspectRatio: 1 / 1
//   });
//   btn.innerText = 'Save';
//   btn.setAttribute('onclick', "save('" + id + "',this,'" + key + "')");
//   btn.parentElement.parentElement.querySelectorAll('button.editAction').forEach(e => {
//     e.removeAttribute('disabled')
//   });
// };

// // select image
// function selectImage(id, btn, key) {
//   if (window[id]?.cropper) window[id]?.destroy();
//   btn.parentElement.querySelector('input').click();
//   btn.parentElement.querySelector('button').innerText = 'Edit image';
//   btn.parentElement.querySelector('button').setAttribute('onclick', "cropperJS('" + id + "',this,'" + key + "')");
//   btn.parentElement.parentElement.querySelectorAll('button.editAction').forEach(e => {
//     e.setAttribute('disabled', '');
//   });
//   // btn.setAttribute('onclick', "selectImageB('" + id + "',this)");
// };

// // crop and save result ot imgFIles
// function save(id, btn, key) {
//   let data = window[id].getCroppedCanvas().toDataURL('image/jpeg');
//   let blob = window[id].getCroppedCanvas().toBlob(blob => {
//     imgFiles[key] = new File([blob], 'Edited.png', blob);
//   });
//   window[id].destroy();
//   btn.innerText = 'Edit image';
//   btn.setAttribute('onclick', "cropperJS('" + id + "',this,'" + key + "')");
//   document.getElementById(id).src = data;
// };

// //..
// function flipImageXA(btn, id) {
//   window[id].scaleX(-1);
//   btn.setAttribute('onclick', "flipImageXB(this,'" + id + "')");
// };

// //..
// function flipImageXB(btn, id) {
//   window[id].scaleX(1);
//   btn.setAttribute('onclick', "flipImageXA(this,'" + id + "')")
// };

// //..
// function flipImageYA(btn, id) {
//   window[id].scaleY(-1);
//   btn.setAttribute('onclick', "flipImageYB(this,'" + id + "')");
// };

// //..
// function flipImageYB(btn, id) {
//   window[id].scaleY(1);
//   btn.setAttribute('onclick', "flipImageYA(this,'" + id + "')");
// };

// add event listners to each input and saves the result in imgFiles object
// (function attachEvenListners() {
//   const DOCS_TO_DISPLAY_IMG_IDS = ['imgA_DISP', 'imgB_DISP', 'imgC_DISP', 'imgD_DISP'];
//   const IDS_OF_FILE_INPUT = ['imgA', 'imgB', 'imgC', 'imgD'];
//   const IDS_OF_FILE_INPUT_KEY = ['img1', 'img2', 'img3', 'img4'];
//   IDS_OF_FILE_INPUT.forEach((id, index, array) => {
//     document.getElementById(id).addEventListener('change', (e) => {
//       if (e.target.files) {
//         // imgFiles['img' + (index + 1)] = e.target.files;
//         e.target.parentElement.parentElement.querySelector('.choose')?.remove();
//         e.target.parentElement.querySelector('button').removeAttribute('disabled');
//         setTimeout(() => {
//           e.target.parentElement.querySelector('button').click();
//         }, 200)
//         document.getElementById(DOCS_TO_DISPLAY_IMG_IDS[index]).src = URL.createObjectURL(e.target.files[0]);
//         document.getElementById(DOCS_TO_DISPLAY_IMG_IDS[index]).classList.add('changed');
//       }
//     });
//   });
// })();

const xmlRq = new XMLHttpRequest();

// valdiate and send to server if good else show error message
function updateUserData() {

  const provider = '';
  const UID = ''

  const title = document.getElementById("titleInput");
  const description = document.getElementById("descriptionInput");
  const price = document.getElementById("priceInput");
  const quantity = document.getElementById("quantityInput");
  const offer = document.getElementById('offerInput');
  const category = document.getElementById('categoryInput');
  const imgA = document.getElementById('imgA');
  const imgB = document.getElementById('imgB');
  const imgC = document.getElementById('imgC');
  const imgD = document.getElementById('imgD');

  const errorTitle = title.parentElement.querySelector("span");
  const errorDescription = description.parentElement.querySelector("span");
  const errorPrice = price.parentElement.querySelector("span");
  const errorQuantity = quantity.parentElement.querySelector("span");
  const errorOffer = offer.parentElement.querySelector("span");
  const errorCategory = category.parentElement.querySelector("span");
  const errorimgA = imgA.parentElement.parentElement.querySelector("span");
  const errorimgB = imgB.parentElement.parentElement.querySelector("span");
  const errorimgC = imgC.parentElement.parentElement.querySelector("span");
  const errorimgD = imgD.parentElement.parentElement.querySelector("span");

  errorTitle.innerHTML = '';
  errorDescription.innerHTML = '';
  errorPrice.innerHTML = '';
  errorQuantity.innerHTML = '';
  errorOffer.innerHTML = '';
  errorCategory.innerHTML = '';
  errorimgA.innerHTML = '';
  errorimgB.innerHTML = '';
  errorimgC.innerHTML = '';
  errorimgD.innerHTML = '';

  const disp = ({
    message,
    isGood,
    returnVal,
    errI
  }) => {
    switch (errI) {
      case 1: {
        errorTitle.innerText = message;
        break;
      };
      case 2: {
        errorDescription.innerText = message;
        break;
      };
      case 3: {
        errorPrice.innerText = message;
        break;
      };
      case 4: {
        errorQuantity.innerText = message;
        break;
      };
      case 5: {
        errorOffer.innerText = message;
        break;
      };
      case 6: {
        errorCategory.innerText = message;
        break;
      };
      case 7: {
        errorimgA.innerText = message;
        break;
      };
      case 8: {
        errorimgB.innerText = message;
        break;
      };
      case 9: {
        errorimgC.innerText = message;
        break;
      };
      case 10: {
        errorimgD.innerText = message;
        break;
      };
      case 11: {
        document.getElementById("disp_state").style.display = 'none';
        break;
      }
      default: {
        let disp_state = document.getElementById("disp_state");
        disp_state.style.backgroundColor = isGood ? 'rgb(205 255 196 / 56%)' : 'rgb(255 203 203 / 56%)';
        disp_state.style.display = message || returnVal == false ? 'flex' : 'none';
        disp_state.innerText = message ? message : disp_state.innerText;
        break;
      };
    };
    return isGood || message == '' ? true : returnVal;
  };

  disp({
    errI: 11
  });

  let thereIsNoError = true;
  let imgChecker = 0;
  const imageMessage = 'You must select and crop this image';

  imgChecker = imgFiles?.img1?.name == 'Edited.png' ?
    ++imgChecker :
    disp({
      message: imageMessage,
      returnVal: imgChecker,
      errI: 7
    });
  imgChecker = imgFiles?.img2?.name == 'Edited.png' ?
    ++imgChecker :
    disp({
      message: imageMessage,
      returnVal: imgChecker,
      errI: 8
    });
  imgChecker = imgFiles?.img3?.name == 'Edited.png' ?
    ++imgChecker :
    disp({
      message: imageMessage,
      returnVal: imgChecker,
      errI: 9
    });
  imgChecker = imgFiles?.img4?.name == 'Edited.png' ?
    ++imgChecker :
    disp({
      message: imageMessage,
      returnVal: imgChecker,
      errI: 10
    });

  thereIsNoError = imgChecker === 4 ? thereIsNoError : false;


  thereIsNoError = category.value.length > 0 ?
    disp({
      returnVal: thereIsNoError
    }) :
    disp({
      message: 'Select catogery',
      returnVal: false,
      errI: 6
    });

  thereIsNoError = isNaN(offer.value) && offer.value.length > 0 ?
    disp({
      message: 'Enter a valid Discount amount',
      returnVal: false,
      errI: 5
    }) :
    disp({
      returnVal: thereIsNoError
    });

  thereIsNoError = isNaN(quantity.value) || quantity.value.length == 0 ?
    disp({
      message: 'Enter a valid Quantity amount',
      returnVal: false,
      errI: 4
    }) :
    disp({
      returnVal: thereIsNoError
    });

  thereIsNoError = isNaN(price.value) || price.value.length == 0 ?
    disp({
      message: 'Enter a valid Price amount',
      returnVal: false,
      errI: 3
    }) :
    disp({
      returnVal: thereIsNoError
    });

  thereIsNoError = description.value.length < 20 ?
    disp({
      message: `Description must contain ${20 - description.value.length} more characters`,
      returnVal: false,
      errI: 2
    }) :
    disp({
      returnVal: thereIsNoError
    });

  thereIsNoError = title.value.length < 10 ?
    disp({
      message: `Title must contain ${10 - title.value.length} more characters`,
      returnVal: false,
      errI: 1
    }) :
    disp({
      returnVal: thereIsNoError
    });

  if (thereIsNoError) {

    const formData = new FormData();

    const data = {
      title: title.value ? title.value : null,
      description: description.value ? description.value : null,
      price: price.value ? price.value : null,
      quantity: quantity.value ? quantity.value : null,
      offer: offer.value ? offer.value : null,
      category: category.value ? category.value : null
    };

    formData.append('img1', imgFiles?.img1);
    formData.append('img2', imgFiles?.img2);
    formData.append('img3', imgFiles?.img3);
    formData.append('img4', imgFiles?.img4);
    formData.append("data", JSON.stringify(data));

    xmlRq.abort();
    xmlRq.open('POST', '/admin_panel/products/add_product');

    xmlRq.upload.addEventListener('progress', ({
      loaded,
      total
    }) => {

      let status = Math.floor((loaded / total) * 100);
      document.getElementById("Progress__cont").style.display = 'flex';
      document.getElementById("Progress_Bar").style.width = status + '%';
      document.getElementById("Progress_Bar").innerText = status + '% Uploaded...';
      if (status == 100) {
        document.getElementById("Progress_Bar").innerText = `Processing...`;
      };
    });

    xmlRq.onreadystatechange = (e) => {
      if (xmlRq.readyState === 4) {
        if (xmlRq.status == 200) {
          let res = JSON.parse(xmlRq.response);

          disp({
            message: res.message,
            isGood: res.status == 'error' ? false : true
          });

          if (res.status == 'good') {
            if (res?.action) {
              window.location.href = action;
            } else {
              window.location.reload();
            };
          };

        } else {
          disp({
            message: 'Error connecting to server'
          });
        };
      };
    };

    xmlRq.addEventListener('error', (error) => {
      disp({
        message: "Error connecting to server"
      });
      console.error(error);
    });

    // sends data to server
    xmlRq.send(formData);

  };
};