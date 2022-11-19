function getAllUserAddressInputs(type) {
    // keys and ids of user inputs
    const inputs = {
      name: 'nameInputAdd',
      houseNumber: 'houseNumberAdd',
      streetNumber: 'streetNumberAdd',
      state: 'stateInputAdd',
      town: 'townInputAdd',
      country: 'countryInputAdd',
      postalCode: 'codeInputAdd',
      phone: 'phoneInputAdd',
      email: 'emailInputAdd'
    };
    // getting adn assigning documnts
    Object.keys(inputs).forEach(e => {
      if (type == 'err') inputs[e] = document?.getElementById(inputs[e])?.parentElement?.querySelector('span');
      else inputs[e] = document?.getElementById(inputs[e]);
    });

    // return all inputs with therir values
    return inputs;
  };

  const addressInputs = getAllUserAddressInputs();
  const addressInputsErr = getAllUserAddressInputs('err');

  function openAddressModel() {
    $('#myModal').modal();
  };

  function getAddressForm(addressID) {
    Swal.fire({
      title: 'Updating your data',
      html: 'Plz wait while processing...',
      didOpen: () => {
        Swal.showLoading();
        fetch('/checkout/address', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              addressID: addressID
            })
          })
          .then(res => res.json())
          .then(res => {
            if (res.status == 'error') {
              Swal.close();
              Swal.fire({
                title: 'Error fetching address',
                icon: 'error',
                confirmButtonText: 'Close'
              });
            } else {
              Swal.close();
              openAddressModel();
              window.addressID = addressID;
              Object.keys(addressInputs).forEach(key => {
                addressInputs[key].value = res.message[key];
                if (key == 'country') addressInputs[key].value = res.message['countryCode'];
              });
            }
          })
          .catch(error => {
            Swal.close();
            Swal.fire({
              title: 'Oops thats an error',
              html: 'Error connecting to server',
              icon: 'error',
              confirmButtonText: 'Contnue shopping'
            });
          });
      }
    });
  };

  function validateAddress() {
    const output = {};
    let thereIsNoErr = true;
    const errFlagger = (key, message) => {
      addressInputsErr[key].innerText = message;
      thereIsNoErr = false;
    };
    Object.keys(addressInputsErr).forEach(key => {
      if (addressInputsErr[key]) addressInputsErr[key].innerText = '';
    });
    Object.keys(addressInputs).forEach(key => {
      let value = addressInputs[key]?.value;
      value = (value + "").trim();
      if (key == 'name' && value?.match(/^[a-zA-Z]+(([a-zA-Z ])?[a-zA-Z]*)*$/g)) output[key] = value;
      else if (key == 'name') errFlagger(key, 'Plz enter a valid name');
      if (key == 'houseNumber' && value?.length > 2) output[key] = value;
      else if (key == 'houseNumber') errFlagger(key, 'Plz enter a valid data');
      if (key == 'streetNumber' && value?.length > 2) output[key] = value;
      else if (key == 'streetNumber') errFlagger(key, 'Plz enter a valid data');
      if (key == 'state' && value?.match(/^[a-zA-Z]+(([a-zA-Z ])?[a-zA-Z]*)*$/g)) output[key] = value;
      else if (key == 'state') errFlagger(key, 'Plz enter a valid State');
      if (key == 'town' && value?.match(/^[a-zA-Z]+(([a-zA-Z ])?[a-zA-Z]*)*$/g)) output[key] = value;
      else if (key == 'town') errFlagger(key, 'Plz enter a valid Town name');
      if (key == 'country' && value?.length == 2) output[key] = value;
      else if (key == 'country') errFlagger(key, 'Plz select your country');
      if (key == 'postalCode' && value?.length == 6 && !isNaN(value)) output[key] = value;
      else if (key == 'postalCode') errFlagger(key, 'Enter a valid postal code');
      if (key == 'phone' && value?.match(/^\+?[1-9][0-9]{7,14}$/g) && value?.length == 10) output[key] = value;
      else if (key == 'phone') errFlagger(key, 'Plz enter a valid phone number');
      if (key == 'email' && value?.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) output[key] = value;
      else if (key == 'email') errFlagger(key, 'Plz enter a valid email id');
    });
    output.thereIsNoErr = thereIsNoErr;
    return output;
  };

  function updateAddresData() {
    const dataToUpdate = validateAddress();
    if (dataToUpdate.thereIsNoErr) {
      Object.keys(addressInputs).forEach(key => {
        if (addressInputs[key]?.value?.trim()) dataToUpdate[key] = addressInputs[key]?.value?.trim();
      });
      dataToUpdate.addressID = window.addressID;
      Swal.fire({
        title: 'Connecting to server',
        html: 'Plz wait while processing...',
        didOpen: () => {
          Swal.showLoading();
          fetch('/user_address', {
              headers: {
                'Content-Type': 'application/json'
              },
              method: 'PUT',
              body: JSON.stringify(dataToUpdate)
            })
            .then(res => res.json())
            .then(res => {
              console.log(res);
              if (res.status == 'error') {
                Swal.close();
                Swal.fire({
                  title: res.message,
                  icon: 'error',
                  confirmButtonText: 'Close'
                });
              } else {
                Swal.close();
                Swal.fire({
                  title: res.message,
                  icon: 'success',
                  confirmButtonText: 'Close'
                });
              };
            })
            .catch(error => {
              Swal.close();
              Swal.fire({
                title: 'Oops thats an error',
                html: 'Error connecting to server',
                icon: 'error',
                confirmButtonText: 'Contnue shopping'
              });
            });
        }
      });
    } else {
      // Enter valid data to update
    };
  };

  function getAllUserInputs(type) {
    // keys and ids of user inputs
    const inputs = {
      fNameInput: 'nameInput',
      lNameInput: 'lNameInput',
      displayNameInput: 'displayName',
      emailInput: 'emailInput',
      phoneInput: 'phoneInput',
      currentPasswordInput: 'currentPassword',
      newPasswordInput: 'newPassword',
      confirmPasswordInput: 'confirmPassword'
    };
    // getting adn assigning documnts
    Object.keys(inputs).forEach(e => {
      if (type == 'err') inputs[e] = document?.getElementById(inputs[e])?.parentElement?.querySelector('span');
      else inputs[e] = document?.getElementById(inputs[e]);
    });

    // return all inputs with therir values
    return inputs;
  };

  const userInputs = getAllUserInputs();
  const userInputsErr = getAllUserInputs('err');

  function validateUserData() {
    const output = {};
    let thereIsNoErr = true;
    const errFlagger = (key, message) => {
      userInputsErr[key].innerText = message;
      thereIsNoErr = false;
    };
    Object.keys(userInputsErr).forEach(key => {
      if (userInputsErr[key]) userInputsErr[key].innerText = '';
    });
    Object.keys(userInputs).forEach((key, i) => {
      let value = userInputs[key]?.value;
      value = (value + "").trim();
      if (key == 'fNameInput' && value?.match(/^[a-zA-Z]+(([a-zA-Z ])?[a-zA-Z]*)*$/g) && value?.length > 0) output[key] = value;
      else if (key == 'fNameInput' && value?.length > 0) errFlagger(key, 'Plz enter a valid name');
      if (key == 'lNameInput' && value?.match(/^[a-zA-Z]+(([a-zA-Z ])?[a-zA-Z]*)*$/g) && value?.length > 0) output[key] = value;
      else if (key == 'lNameInput' && value?.length > 0) errFlagger(key, 'Plz enter a valid name');
      if (key == 'displayNameInput' && value?.match(/^[a-zA-Z]+(([a-zA-Z ])?[a-zA-Z]*)*$/g)) output[key] = value;
      else if (key == 'displayNameInput' && value?.length > 0) errFlagger(key, 'Plz enter a valid display name');
      if (key == 'emailInput' && value?.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/) && value?.length > 0) output[key] = value;
      else if (key == 'emailInput' && value?.length > 0) errFlagger(key, 'Plz enter a valid email id');
      if (key == 'phoneInput' && value?.match(/^\+?[1-9][0-9]{7,14}$/g) && value?.length == 10) output[key] = value;
      else if (key == 'phoneInput' && value?.length > 0) errFlagger(key, 'Plz enter a valid phone number');
      if (userInputs[key]) {
        if (key == 'currentPasswordInput' && value?.length >= 6) output[key] = value;
        else if (key == 'currentPasswordInput' && value?.length > 0) errFlagger(key, 'Plz enter a valid password');
        if (key == 'newPasswordInput' && value?.length >= 6) output[key] = value;
        else if (key == 'newPasswordInput' && value?.length > 0) errFlagger(key, 'Plz enter a valid password');
        if (key == 'confirmPasswordInput' && value == userInputs['newPasswordInput'].value && value?.length >= 6) output[key] = value;
        else if (key == 'confirmPasswordInput' && userInputs['newPasswordInput'].value.length > 0) errFlagger(key, "Confirm password dosen't match");
      }
    });
    output.thereIsNoErr = thereIsNoErr;
    return output;
  };

  function updaeUserData() {
    const userData = validateUserData();
    if (userData.thereIsNoErr) {
      Swal.fire({
        title: 'Updating your data',
        html: 'Plz wait while processing...',
        didOpen: () => {
          Swal.showLoading();

          fetch('/user_data/update', {
              method: "PUT",
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(userData)
            })
            .then(res => res.json())
            .then(res => {
              if (res.status == 'error') {
                Swal.close();
                Swal.fire({
                  title: res.message,
                  icon: 'error',
                  confirmButtonText: 'Close'
                });
              } else {
                Swal.close();
                Swal.fire({
                  title: res.message,
                  icon: 'success',
                  confirmButtonText: 'Ok'
                });
              }
            })
            .catch(error => {
              Swal.close();
              Swal.fire({
                title: 'Oops thats an error',
                html: 'Error connecting to server',
                icon: 'error',
                confirmButtonText: 'Contnue shopping'
              });
            });
        }
      });
    };
  };

  function logout() {

    fetch('/user_logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: "log me out"
        })
      })
      .then(res => res.json())
      .then(res => {
        if (res.status == 'error') {
          disp({
            message: res.message,
            isGood: false
          })
        } else {
          window.location.href = res.action;
        };
      })
      .catch(error => {
        disp({
          message: error,
          isGood: false
        });
      });
  };
  async function cancelOrder(orderID, PID, statusDisp) {

    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, cancel it!'
    }).then((result) => {

      if (result.isConfirmed) {

        Swal.fire({
          title: 'Cancelling your order',
          html: 'Plz wait while processing...',
          didOpen: () => {
            Swal.showLoading();

            fetch('/orders/cancel/', {
                headers: {
                  'Content-Type': 'application/json'
                },
                method: "POST",
                body: JSON.stringify({
                  orderID: orderID,
                  PID: PID
                })
              })
              .then(res => res.json())
              .then(res => {
                console.log("RSULT => ", res);
                if (res.status == 'error') {
                  // error...
                  Swal.close();
                  Swal.fire({
                    title: res.message,
                    icon: 'error',
                    confirmButtonText: 'Contnue shopping'
                  });
                } else {
                  // cancelled...
                  statusDisp.parentElement.parentElement.querySelector('.order_status_info').innerText = 'Status : Cancelled';
                  statusDisp.remove();
                  Swal.close();
                  Swal.fire({
                    title: res.message,
                    icon: 'success',
                    confirmButtonText: 'Contnue shopping'
                  });
                };
              })
              .catch(error => {
                // error...
                Swal.close();
                Swal.fire({
                  title: error,
                  icon: 'error',
                  confirmButtonText: 'Contnue shopping'
                });
              });

          }
        }).then((result) => {
          /* Read more about handling dismissals below */
          if (result.dismiss === Swal.DismissReason.timer) {
            console.log('I was closed by the timer')
          };
        });

      };
    });
  };