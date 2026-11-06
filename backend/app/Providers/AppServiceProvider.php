<?php

namespace App\Providers;

use App\Contracts\VerificadorBanco;
use App\Services\VerificadorBancoPdo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * @var array<class-string, class-string>
     */
    public array $bindings = [
        VerificadorBanco::class => VerificadorBancoPdo::class,
    ];

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Model::shouldBeStrict(! $this->app->isProduction());
    }
}
