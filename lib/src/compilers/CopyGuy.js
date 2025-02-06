const fs = require("fs");
const path = require("path");

const CopyGuyCompile = (filepath) => {
  const regex = /\*\*\*(.*?)\*\*\*/gs;
  const content = fs.readFileSync(filepath, { encoding: "utf-8" });

  // Eliminar la zona de configuración
  const contentWithoutCfg = content.replace(regex, "").trim();

  const matches = content.match(regex);
  if (!matches) return;

  const cfgzone = JSON.parse(matches.map(match => match.replace(/\*\*\*/g, "").trim())[0]);

  // VARIABLES DEL CFGZONE
  const basename = cfgzone.basename;
  const fext = cfgzone.ext;
  const filelist = cfgzone.filelist;  // Array con los nombres de los archivos a crear
  const tags = cfgzone.tags;          // Objeto con las tags para cada archivo

  // Crear archivos basados en filelist
  filelist.forEach((filename) => {
    // Reemplazo de tags específico para cada archivo
    let modifiedContent = contentWithoutCfg.replace(/%\[(.*?)\]/g, (match, tagName) => {
      // Si la tag existe para el archivo actual, la reemplazamos; si no, dejamos el tag sin modificar
      return tags[filename] && tags[filename][tagName] !== undefined ? tags[filename][tagName] : match;
    });

    // Guardar el contenido modificado en un archivo
    const outputFilePath = path.join(path.dirname(filepath), `${basename}${filename}.${fext}`);
    fs.writeFileSync(outputFilePath, modifiedContent, { encoding: "utf-8" });

    console.log(`Archivo creado: ${outputFilePath}`);
  });
};

module.exports = { CopyGuyCompile };
