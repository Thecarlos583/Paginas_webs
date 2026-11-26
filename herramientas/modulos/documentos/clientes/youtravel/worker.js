// YouTravel: el Worker de su web (Novedades) + el panel de documentos en /admin.
// Lo publica herramientas\modulos\novedades\publicar.ps1 youtravel (su wrangler.jsonc apunta aquí).
import novedades from "../../../novedades/src/index.js";
import { conDocumentos } from "../../src/index.js";
import config from "./config.json";

export default conDocumentos(config, novedades);
