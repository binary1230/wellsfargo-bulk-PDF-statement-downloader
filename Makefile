.PHONY: all clean

all: bookmarklet.min.js

bookmarklet.min.js: original-source.js generate-bookmarklet.js
	node generate-bookmarklet.js original-source.js > bookmarklet.min.js

clean:
	rm bookmarklet.min.js
