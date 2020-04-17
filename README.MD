## State Boundaries

These are the 2018 Census State Boundaris at `20m`. Converted with:

```bash
ogr2ogr -f GeoJSON -t_srs crs:84 state-bounds.json cb_2018_us_state_20m.shp
```
