<?php

it('libera na CSP so os frames da propria origem e do youtube-nocookie', function (string $caminho) {
    $this->get($caminho)
        ->assertOk()
        ->assertHeader('Content-Security-Policy', "frame-src 'self' https://www.youtube-nocookie.com");
})->with(['/api/v1/referencias', '/up']);
