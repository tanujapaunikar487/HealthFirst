<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class TestHybridBooking extends Command
{
    protected $signature = 'test:booking {--scenario=all : Which scenario to test (all, symptom, datetime, vague, relative, followup)}';
    protected $description = 'Test the Hybrid Booking System with various conversation scenarios';

    public function handle()
    {
        $this->info('');
        $this->info('🧪 Hybrid Booking System Test Suite');
        $this->info('===================================');
        $this->info('');

        $scenario = $this->option('scenario');

        $this->info("Running tests for scenario: {$scenario}");
        $this->info('');

        // Run the test
        $exitCode = Artisan::call('test', [
            '--filter' => 'HybridBookingConversationTest',
            '--stop-on-failure' => false,
        ]);

        $output = Artisan::output();
        $this->line($output);

        if ($exitCode === 0) {
            $this->info('');
            $this->info('✅ Tests completed successfully!');
        } else {
            $this->error('');
            $this->error('❌ Some tests failed. Check output above for details.');
        }

        return $exitCode;
    }
}
