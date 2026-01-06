<?php

test('the application redirects unauthenticated users to login', function () {
    $response = $this->get('/');

    $response->assertRedirect('/login');
});
