"use strict";

const gulp = require("gulp");
const ts = require("gulp-typescript");
const sourcemaps = require("gulp-sourcemaps");
const babel = require('gulp-babel');
const os = require("os");

const tsConfig = {
    target: "es6",
    noImplicitAny: true,
    noEmitOnError: true,
    removeComments: false,
    suppressImplicitAnyIndexErrors: true
};

gulp.task("default", ["build"]);

gulp.task("build", () => {
    return gulp
        .src(["src/**/*.ts", "inc/**/*.d.ts"])
        .pipe(ts(tsConfig))
        .js
        .pipe(gulp.dest("bin/es6"))
        .pipe(babel({
            presets: ["es2015"]
        }))
        .pipe(gulp.dest('bin/es5'));
});
