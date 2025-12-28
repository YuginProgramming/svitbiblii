/**
 * Validation Script for Mailing Iterations
 * Checks correctness of chapters vs verses in the mailing_iterations table
 */

import { sequelize } from '../database/sequelize.js';
import MailingIteration from '../database/models/MailingIteration.js';
import { findBookForChapter, BOOKS_DATA } from '../navigation/bookData.js';

/**
 * Validate a single mailing iteration record
 * @param {Object} record - MailingIteration record
 * @returns {Object} Validation result with errors and warnings
 */
function validateMailingIteration(record) {
  const errors = [];
  const warnings = [];
  
  // 1. Check if chapterIndex is valid (within any book's range)
  const maxChapterIndex = Math.max(...BOOKS_DATA.map(book => book.startIndex + book.chapterCount - 1));
  if (record.chapterIndex < 0 || record.chapterIndex > maxChapterIndex) {
    errors.push(`Invalid chapterIndex: ${record.chapterIndex} (valid range: 0-${maxChapterIndex})`);
  }
  
  // 2. Find which book should contain this chapterIndex
  const correctBookInfo = findBookForChapter(record.chapterIndex);
  if (!correctBookInfo) {
    errors.push(`Chapter index ${record.chapterIndex} does not belong to any book`);
    return { errors, warnings, isValid: false };
  }
  
  // 3. Check if bookName matches the correct book
  if (record.bookName !== correctBookInfo.book.title) {
    errors.push(
      `Book name mismatch: stored "${record.bookName}" but chapterIndex ${record.chapterIndex} belongs to "${correctBookInfo.book.title}"`
    );
  }
  
  // 4. Check if chapterNumber matches the calculated chapter number
  const correctChapterNumber = correctBookInfo.chapterInBook;
  if (record.chapterNumber !== correctChapterNumber) {
    errors.push(
      `Chapter number mismatch: stored ${record.chapterNumber} but should be ${correctChapterNumber} (chapterIndex ${record.chapterIndex} in book "${correctBookInfo.book.title}")`
    );
  }
  
  // 5. Check if verseNumbers and verseTexts arrays exist and have same length
  if (!Array.isArray(record.verseNumbers) || record.verseNumbers.length === 0) {
    errors.push(`verseNumbers is empty or not an array`);
  }
  
  if (!Array.isArray(record.verseTexts) || record.verseTexts.length === 0) {
    errors.push(`verseTexts is empty or not an array`);
  }
  
  if (Array.isArray(record.verseNumbers) && Array.isArray(record.verseTexts)) {
    if (record.verseNumbers.length !== record.verseTexts.length) {
      errors.push(
        `Array length mismatch: verseNumbers has ${record.verseNumbers.length} elements but verseTexts has ${record.verseTexts.length}`
      );
    }
    
    // 6. Check if verse numbers are valid (should be positive integers)
    record.verseNumbers.forEach((verseNum, index) => {
      if (!Number.isInteger(verseNum) || verseNum < 1) {
        errors.push(`Invalid verse number at index ${index}: ${verseNum} (should be positive integer)`);
      }
    });
    
    // 7. Check if verse texts are not empty
    record.verseTexts.forEach((verseText, index) => {
      if (!verseText || typeof verseText !== 'string' || verseText.trim().length === 0) {
        warnings.push(`Empty or invalid verse text at index ${index}`);
      }
    });
    
    // 8. Check if verse numbers are consecutive (warning, not error)
    for (let i = 1; i < record.verseNumbers.length; i++) {
      if (record.verseNumbers[i] !== record.verseNumbers[i - 1] + 1) {
        warnings.push(
          `Non-consecutive verse numbers: ${record.verseNumbers[i - 1]} followed by ${record.verseNumbers[i]}`
        );
        break; // Only warn once per record
      }
    }
  }
  
  // 9. Check if chapterIndex is within the book's range
  if (record.chapterIndex < correctBookInfo.book.startIndex || 
      record.chapterIndex >= correctBookInfo.book.startIndex + correctBookInfo.book.chapterCount) {
    errors.push(
      `Chapter index ${record.chapterIndex} is outside book "${correctBookInfo.book.title}" range (${correctBookInfo.book.startIndex} to ${correctBookInfo.book.startIndex + correctBookInfo.book.chapterCount - 1})`
    );
  }
  
  return {
    errors,
    warnings,
    isValid: errors.length === 0,
    correctBook: correctBookInfo.book.title,
    correctChapterNumber: correctChapterNumber
  };
}

/**
 * Main validation function
 */
async function validateAllMailingIterations() {
  try {
    console.log('🔍 Starting validation of mailing_iterations table...\n');
    
    // Fetch all mailing iterations
    const records = await MailingIteration.findAll({
      order: [['sentAt', 'DESC']]
    });
    
    console.log(`📊 Found ${records.length} mailing iteration records\n`);
    
    if (records.length === 0) {
      console.log('ℹ️  No records to validate');
      return;
    }
    
    // Validate each record
    const results = {
      total: records.length,
      valid: 0,
      invalid: 0,
      errors: [],
      warnings: []
    };
    
    records.forEach((record, index) => {
      const validation = validateMailingIteration(record.toJSON());
      
      if (validation.isValid) {
        results.valid++;
      } else {
        results.invalid++;
      }
      
      if (validation.errors.length > 0 || validation.warnings.length > 0) {
        results.errors.push({
          id: record.id,
          sentAt: record.sentAt,
          bookName: record.bookName,
          chapterIndex: record.chapterIndex,
          chapterNumber: record.chapterNumber,
          correctBook: validation.correctBook,
          correctChapterNumber: validation.correctChapterNumber,
          errors: validation.errors,
          warnings: validation.warnings
        });
      }
    });
    
    // Print summary
    console.log('='.repeat(80));
    console.log('📋 VALIDATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total records: ${results.total}`);
    console.log(`✅ Valid: ${results.valid}`);
    console.log(`❌ Invalid: ${results.invalid}`);
    console.log(`⚠️  Records with issues: ${results.errors.length}\n`);
    
    // Print detailed errors
    if (results.errors.length > 0) {
      console.log('='.repeat(80));
      console.log('❌ ERRORS AND WARNINGS');
      console.log('='.repeat(80));
      
      results.errors.forEach((errorRecord, index) => {
        console.log(`\n[${index + 1}] Record ID: ${errorRecord.id}`);
        console.log(`    Sent at: ${errorRecord.sentAt}`);
        console.log(`    Stored bookName: "${errorRecord.bookName}"`);
        console.log(`    Stored chapterIndex: ${errorRecord.chapterIndex}`);
        console.log(`    Stored chapterNumber: ${errorRecord.chapterNumber}`);
        
        if (errorRecord.correctBook !== errorRecord.bookName) {
          console.log(`    ✅ Correct bookName: "${errorRecord.correctBook}"`);
        }
        if (errorRecord.correctChapterNumber !== errorRecord.chapterNumber) {
          console.log(`    ✅ Correct chapterNumber: ${errorRecord.correctChapterNumber}`);
        }
        
        if (errorRecord.errors.length > 0) {
          console.log(`    ❌ ERRORS:`);
          errorRecord.errors.forEach(err => console.log(`       - ${err}`));
        }
        
        if (errorRecord.warnings.length > 0) {
          console.log(`    ⚠️  WARNINGS:`);
          errorRecord.warnings.forEach(warn => console.log(`       - ${warn}`));
        }
      });
      
      // Group errors by type
      console.log('\n' + '='.repeat(80));
      console.log('📊 ERROR STATISTICS');
      console.log('='.repeat(80));
      
      const errorTypes = {};
      results.errors.forEach(record => {
        record.errors.forEach(error => {
          const errorType = error.split(':')[0];
          errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
        });
      });
      
      Object.entries(errorTypes)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
          console.log(`   ${type}: ${count}`);
        });
    } else {
      console.log('✅ All records are valid! No errors found.');
    }
    
    // Print sample of valid records
    if (results.valid > 0 && results.errors.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('✅ SAMPLE VALID RECORDS');
      console.log('='.repeat(80));
      
      const validRecords = records.filter(r => {
        const validation = validateMailingIteration(r.toJSON());
        return validation.isValid;
      }).slice(0, 5);
      
      validRecords.forEach((record, index) => {
        console.log(`\n[${index + 1}] ID: ${record.id} | ${record.bookName} | Chapter ${record.chapterNumber} (index ${record.chapterIndex}) | Verses: ${record.verseNumbers.join(', ')}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during validation:', error);
  } finally {
    await sequelize.close();
  }
}

// Run validation
validateAllMailingIterations();

