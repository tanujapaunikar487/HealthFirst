<?php

namespace App\Console\Commands;

use App\Services\AI\OllamaHealthCheck;
use Illuminate\Console\Command;

class CheckOllamaHealth extends Command
{
    protected $signature = 'ollama:health {--clear-cache : Clear health check cache}';
    protected $description = 'Check if Ollama is running and healthy';

    public function handle(OllamaHealthCheck $healthCheck): int
    {
        if ($this->option('clear-cache')) {
            $healthCheck->clearHealthCache();
            $this->info('Health check cache cleared');
            $this->newLine();
        }

        $this->info('Checking Ollama health...');
        $this->newLine();

        $status = $healthCheck->getComprehensiveStatus();

        // Display Ollama service status
        if ($status['healthy']) {
            $this->info('✅ Ollama Service: Running');
            $this->line('   URL: ' . $status['url']);
        } else {
            $this->error('❌ Ollama Service: Not Running');
            $this->line('   URL: ' . $status['url']);
        }

        $this->newLine();

        // Display model status
        if ($status['healthy']) {
            if ($status['model_available']) {
                $this->info('✅ Model: ' . $status['model']);
                $this->line('   ' . $status['model_message']);
            } else {
                $this->warn('⚠️  Model: ' . $status['model']);
                $this->line('   ' . $status['model_message']);
                $this->newLine();
                $this->comment('Download the model with:');
                $this->line('  ollama pull ' . $status['model']);
            }
        }

        $this->newLine();

        // Display timestamp
        $this->line('Checked at: ' . $status['timestamp']);

        $this->newLine();

        // Show helpful commands if not healthy
        if (!$status['healthy']) {
            $this->comment('To start Ollama manually:');
            $this->line('  ollama serve');
            $this->newLine();

            $this->comment('To set up auto-start (recommended):');
            $this->line('  ./setup-ollama-service.sh');
            $this->newLine();

            $this->comment('See documentation:');
            $this->line('  cat OLLAMA_AUTO_START.md');

            return Command::FAILURE;
        }

        if (!$status['model_available']) {
            return Command::FAILURE;
        }

        $this->info('🎉 Everything is ready!');

        return Command::SUCCESS;
    }
}
