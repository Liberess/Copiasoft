# Copiasoft

Static official website for CopiaSoft.

## Local editor

Run:

```bat
run-editor.cmd
```

Open:

```txt
http://localhost:5177
```

Use the editor to update site settings, games, notices, updates, patch notes, and release notes. Click `Save & Build` to regenerate the static pages.

The `Visual Builder` tab works like a small page editor:

```txt
Hierarchy: select or reorder Home sections
Canvas Preview: click a section to select it
Inspector: change visibility, padding, background, columns, image position
Desktop/Mobile: switch preview width
```

Asset editing:

```txt
Site Settings > Logo Image: upload or enter /assets/... path
Games > Game Key Art: upload or enter the game card/key art path
Visual Builder > Hero > Hero Background Effect:
  None
  Animated Gradient
  2D Image
  Video
Visual Builder > Hero > Background Image/Video: upload the asset used by the selected effect
```

Uploaded files are saved under:

```txt
assets/uploads/
```

Preview:

```txt
http://localhost:5177/ko/
http://localhost:5177/en/
http://localhost:5177/ko/games/wallbreaker/
```

## Manual build

Run:

```bat
build-site.cmd
```

The generator updates:

```txt
ko/index.html
en/index.html
ko/games/{game}/index.html
en/games/{game}/index.html
sitemap.xml
```

It does not rewrite:

```txt
app-ads.txt
robots.txt
CNAME
ko/privacy/*
en/privacy/*
ko/terms/*
en/terms/*
ko/support/*
en/support/*
```
