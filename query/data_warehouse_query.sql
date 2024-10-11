USE tv_data_warehouse;
DROP table tivi_data;
SELECT * FROM tivi_data LIMIT 500;
SELECT COUNT(*) FROM tivi_data;
SELECT COUNT(*) FROM tivi_data WHERE name IS NULL OR name = '';
SELECT COUNT(*) FROM tivi_data WHERE price < 0;
SELECT * FROM tivi_data WHERE release_year < 2000 OR release_year > YEAR(CURDATE());
SELECT * FROM tivi_data WHERE screen_size NOT LIKE '%inch%';
SELECT name, manufacturer, COUNT(*)
FROM tivi_data
GROUP BY name, manufacturer
HAVING COUNT(*) > 1;
SELECT * FROM tivi_data WHERE price > 100000000;
SELECT * FROM tivi_data WHERE name IS NULL OR price IS NULL OR manufacturer IS NULL;






