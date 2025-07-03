<?php
array_map('unlink', glob("cache/*.cache"));
echo "Cache purgé.";
?>