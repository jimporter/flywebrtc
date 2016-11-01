function initDataChannel(dchannel) {
  let chatlog = document.getElementById('chat-log');
  let input = document.getElementById('chat-input');

  dchannel.onopen = (event) => {
    input.removeAttribute('disabled');
    input.addEventListener('change', (event) => {
      chatlog.textContent += event.target.value + '\n';
      dchannel.send(event.target.value);
      event.target.value = '';
    });
  };

  dchannel.onmessage = (event) => {
    chatlog.textContent += event.data + '\n';
  };
}
