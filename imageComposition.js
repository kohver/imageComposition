(function($) {
    var PLUGIN_NAME = 'imageComposition';
    var DATA_KEY = PLUGIN_NAME;
    var CLASS_LOADING = 'image-compositing';
    var VER = 'ver';
    var HOR = 'hor';

    var methods = {
        init: function(hardPosition) {
            return this.each(function() {
                var position = (hardPosition == 'right') ? VER : (hardPosition == 'bottom' ? HOR : false);
                var $wrap = $(this);
                var $images = $wrap.find('img');
                var imagesNum = $images.length;
                var imagesSizes = [];
                var imagesPerColumn = 5;
                var $firstImage;
                var firstImageSize;
                var firstImageWidth;
                var firstImageHeight;

                var columns = [];
                var wrap = {
                    width: 0,
                    height: 0,
                    maxWidth: $wrap.width(),
                    maxHeight: $wrap.height()
                };

                if ($wrap.data(DATA_KEY) || !imagesNum) return;

                $wrap.data(DATA_KEY, true);
                $wrap.addClass(CLASS_LOADING);

                (function loadImage(i) {
                    var img = new Image();
                    var src = $($images[i]).attr('src');

                    img.onload = function() {
                        imagesSizes.push([img.width, img.height]);
                        if (i == imagesNum - 1) {
                            return onLoadImages();
                        } else {
                            loadImage(i + 1);
                        }
                    };
                    img.src = src;
                })(0);

                function onLoadImages() {
                    if ((imagesNum - 1) % imagesPerColumn == 1) {
                        imagesPerColumn++;
                    } else if ((imagesNum - 1) % imagesPerColumn == 2) {
                        imagesPerColumn--;
                    }
                    if (imagesNum == 2 && !position) {
                        position = VER;
                    }

                    (function() {
                        var imageIndex = 0;
                        var $image = $($images[imageIndex]);
                        var imageWidth = imagesSizes[imageIndex][0];
                        var imageHeight = imagesSizes[imageIndex][1];

                        $firstImage = $image;
                        firstImageWidth = imageWidth;
                        firstImageHeight = imageHeight;
                        firstImageSize = [firstImageWidth, firstImageHeight];

                        if (!position) {
                            position = isHor([firstImageWidth, firstImageHeight]) ? HOR : VER;
                        }

                        if (position == HOR) {
                            firstImageSize = relativeResize(firstImageSize, 'width', Math.min(imageWidth, wrap.maxWidth));
                        } else {
                            firstImageSize = relativeResize(firstImageSize, 'height', Math.min(imageHeight, wrap.maxHeight));
                        }
                        firstImageWidth = firstImageSize[0];
                        firstImageHeight = firstImageSize[1];

                        wrap.width = firstImageWidth;
                        wrap.height = firstImageHeight;
                    })();

                    if (imagesNum <= 1) {
                        return onComplete();
                    }

                    (function() {
                        for (var imageIndex = 1; imageIndex < imagesNum; imageIndex++) {
                            var $image = $($images[imageIndex]);
                            var imageSize = imagesSizes[imageIndex];
                            var imageWidth = imageSize[0];
                            var imageHeight = imageSize[1];
                            var columnIndex = Math.floor((imageIndex - 1) / (position == HOR ? imagesPerColumn : 99));
                            var column = columns[columnIndex];

                            if (!columns[columnIndex]) {
                                column = columns[columnIndex] = {
                                    images: [],
                                    width: 0,
                                    height: 0
                                };
                            }

                            if (position == HOR) {
                                imageSize = relativeResize(imageSize, 'height', 100);
                                column.width += imageSize[0];
                                column.height = imageSize[1];
                            } else {
                                imageSize = relativeResize(imageSize, 'width', 100);
                                column.width = imageSize[0];
                                column.height += imageSize[1];
                            }
                            imageWidth = imageSize[0];
                            imageHeight = imageSize[1];

                            column.images.push({
                                el: $image,
                                width: imageWidth,
                                height: imageHeight
                            });
                        }
                    })();

                    (function() {
                        for (var columnIndex = 0; columnIndex < columns.length; columnIndex++) {
                            var column = columns[columnIndex];
                            var columnSize = [column.width, column.height];
                            var images = column.images;

                            if (position == HOR) {
                                columnSize = relativeResize(columnSize, 'width', wrap.width);
                                wrap.height += columnSize[1];
                            } else {
                                columnSize = relativeResize(columnSize, 'height', wrap.height);
                                wrap.width += columnSize[0];
                            }
                            column.width = columnSize[0];
                            column.height = columnSize[1];

                            for (var imageIndex = 0; imageIndex < images.length; imageIndex++) {
                                var image = images[imageIndex];
                                var imageSize = [image.width, image.height];

                                if (position == HOR) {
                                    imageSize = relativeResize(imageSize, 'height', column.height);
                                } else {
                                    imageSize = relativeResize(imageSize, 'width', column.width);
                                }
                                image.width = imageSize[0];
                                image.height = imageSize[1];
                            }
                        }
                    })();

                    (function() {
                        var coef = 1;

                        if (position == HOR && wrap.height > wrap.maxHeight) {
                            coef = wrap.maxHeight / wrap.height;
                        } else if (wrap.width > wrap.maxWidth) {
                            coef = wrap.maxWidth / wrap.width;
                        }

                        wrap.width *= coef;
                        wrap.height *= coef;
                        firstImageWidth *= coef;
                        firstImageHeight *= coef;

                        for (var columnIndex = 0; columnIndex < columns.length; columnIndex++) {
                            var column = columns[columnIndex];
                            var images = column.images;
                            column.width *= coef;
                            column.height *= coef;

                            for (var imageIndex = 0; imageIndex < images.length; imageIndex++) {
                                var image = images[imageIndex];
                                var $image = image.el;
                                image.width *= coef;
                                image.height *= coef;

                                $image.width(image.width);
                                $image.height(image.height);
                            }
                        }

                        onComplete();
                    })();
                }

                function onComplete() {
                    $wrap.width(wrap.width + 2);
                    $wrap.height(wrap.height + 2);
                    $firstImage.width(firstImageWidth);
                    $firstImage.height(firstImageHeight);
                    $wrap.removeClass(CLASS_LOADING);
                }
            });
        }
    };

    function relativeResize(size, type, width) {
        var w = (type == 'width') ? 0 : 1;
        var h = (type == 'height') ? 0 : 1;
        var coef = size[w] / size[h];

        size[w] = width;
        size[h] = size[w] / coef;

        return size;
    }

    function isHor(sizes) {
        return !!(sizes[0] / sizes[1] > 1.1);
    }

    $.fn[PLUGIN_NAME] = function(method) {
        return methods.init.apply(this, arguments);
    };
})(jQuery);