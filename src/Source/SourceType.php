<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

enum SourceType: string
{
    case Pdf = 'pdf';
    case Csv = 'csv';
    case Text = 'text';
}
