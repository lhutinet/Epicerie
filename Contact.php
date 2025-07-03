
<?php phpinfo(); ?>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link
      rel="shortcut icon"
      type="image/png"
      href="./img/magasin-flyer/logo2-2.jpg"
    />
    <title>Contact Epicerie Proxi Roussillon 38150</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <div id="navbar"></div>
    <script src="./script/navb.js"></script>

    <main>
      <h1>Contact</h1>
      <h3>N'hesitez pas à nous laisser un message</h3>
      <p></p>
      <form
        id="contact"
        name="contact"
        method="POST"
     
      >
        <div class="containtForm">
          <label>
            <input type="text" name="Prénom" placeholder="Prénom *" required
          /></label>

          <label><input type="text" name="Nom" placeholder="Nom  " /></label>
          <label>
            <input type="email" name="email" placeholder="Email *" required
          /></label>

          <label>
            <textarea
              name="textarea"
              id="textareaCont"
              placeholder="Votre texte"
            ></textarea>
          </label>
          <button type="submit">Envoyer</button>
        </div>
      </form>
   
    <!-- </main>
    <canvas id="spiroCanvas"></canvas>
    <script src="./script/animFonf.js"></script> -->
    <footer id="footer"></footer>
  </body>
</html>
