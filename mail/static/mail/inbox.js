document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#compose-form').onsubmit = function () {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
      .then(response => response.json())
      .then(result => {
        // Print result
        console.log(result);
        load_mailbox('sent');
      })
      .catch(error => {
        console.log('Error:', error);
      });
    return false;
  }
  }


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-view').style.display = 'none';


  fetch (`/emails/${mailbox}`)

  .then(response => response.json())
  .then(result => {
  // Show the mailbox name
  var emails = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
   // Add all emails in mailbox
   result.forEach(el => {
    if (el.read) {
      var i = `<div id="${el.id}" class="bg-light text-dark border border-dark my-3 p-3 rounded-lg d-flex flex-row justify-content-between"> <div> <strong>${el.sender}</strong>   ${el.subject}</div> <div> ${el.timestamp} </div></div>`
      emails += i;
    } else {
      var i = `<div id="${el.id}" class=" bg-secondary border border-dark my-3 p-3 rounded-lg d-flex flex-row justify-content-between"> <div> <strong>${el.sender}</strong>   ${el.subject}</div> <div> ${el.timestamp} </div></div>`
      emails += i;
    }
  });
  document.querySelector('#emails-view').innerHTML = emails

  document.querySelectorAll("div.border").forEach(el => el.addEventListener('click', () => read_email(el.id, mailbox)));
});
}


function read_email(email_id, mailbox) {

  const e = email_id;
  if (mailbox === 'archive') {
    var arch = false;
  };
  if (mailbox === 'inbox') {
    var arch = true;
  };

  // Show the email and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-view').style.display = 'block';

  // Load email
  fetch(`/emails/${e}`)
    .then(response => response.json())
    .then(result => {
      if (mailbox === 'archive') {
        var archived = `<button class="btn btn-sm btn-outline-primary" id="archiving">Unarchive</button>`;
      } else if (mailbox === 'inbox') {
        var archived = `<button class="btn btn-sm btn-outline-primary" id="archiving">Archive</button>`;
      } else {
        var archived = ``;
      }
      var body = result.body.replace(/\n/g, '<br>');
      document.querySelector('#read-view').innerHTML = `<p><strong>From:</strong> ${result.sender}</p>
            <p><strong>To:</strong> ${result.recipients}<p><p><strong>Subject:</strong> ${result.subject}</p>
            <p><strong>Timestamp:</strong> ${result.timestamp}<p>${body}</p>
            <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button>` + archived;

      // Add event listeners for reply and archive/unarchive
      if (mailbox === 'inbox' || mailbox === 'archive') {
        document.querySelector('#archiving').addEventListener('click', () => archive(e, arch));
      }
      document.querySelector('#reply').addEventListener('click', () => reply_email(e));
    });

  // Mark email as read
  fetch(`/emails/${e}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })

}

// Archive/unarchive emails
function archive(email_id, arch) {

  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: arch
    })
  })
  load_mailbox('inbox');
}

function reply_email(email_id) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#read-view').style.display = 'none';

  // Fill out composition fields
  fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(result => {
      if (result.subject.slice(0, 3) === 'Re:') {
        var subject = result.subject;
      } else {
        var subject = 'Re: ' + result.subject;
      }
      var body = `\n\nOn ${result.timestamp} ${result.sender} wrote: \n\n` + result.body;
      document.querySelector('#compose-recipients').value = result.sender;
      document.querySelector('#compose-subject').value = subject;
      document.querySelector('#compose-body').value = body;
    });

  // Send email
  document.querySelector('#compose-form').onsubmit = function () {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
      .then(response => response.json())
      .then(result => {
        // Print result
        console.log(result);
        load_mailbox('sent');
      })
      .catch(error => {
        console.log('Error:', error);
      });
    return false;
  }
}