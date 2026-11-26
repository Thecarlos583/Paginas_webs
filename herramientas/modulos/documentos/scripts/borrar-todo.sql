-- Borra todos los datos del panel (clientes, documentos, usuarios y sesiones) y reinicia la numeración.
-- Lo usan demo.ps1 y pasar-a-real.ps1. No borra las tablas.
DELETE FROM sesiones;
DELETE FROM intentos;
DELETE FROM documentos;
DELETE FROM clientes;
DELETE FROM usuarios;
UPDATE contadores SET n = 0;
UPDATE ajustes SET valor = '0' WHERE clave = 'demo';
