import { resolveFileAndLine, resolvePath, parseFile } from '../src/testParser'

/**
 * Original test cases:
 *   Copyright 2020 ScaCap
 *   https://github.com/ScaCap/action-surefire-report/blob/master/utils.test.js
 * 
 * New test cases:
 *   Copyright Mike Penz
 */
describe('resolveFileAndLine', () => {
    it('should default to 1 if no line found', async () => {
        const { fileName, line } = await resolveFileAndLine(null, 'someClassName', 'name', 'not a stacktrace');
        expect(fileName).toBe('someClassName');
        expect(line).toBe(1);
    });

    it('should parse correctly fileName and line for a Java file', async () => {
        const { fileName, line } = await resolveFileAndLine(
            null,
            'action.surefire.report.email.EmailAddressTest',
            'name',
            `
action.surefire.report.email.InvalidEmailAddressException: Invalid email address 'user@ñandú.com.ar'
    at action.surefire.report.email.EmailAddressTest.expectException(EmailAddressTest.java:74)
    at action.surefire.report.email.EmailAddressTest.shouldNotContainInternationalizedHostNames(EmailAddressTest.java:39)
        `
        );
        expect(fileName).toBe('EmailAddressTest');
        expect(line).toBe(39);
    });

    it('should parse correctly fileName and line for a Kotlin file', async () => {
        const { fileName, line } = await resolveFileAndLine(
            null,
            'action.surefire.report.calc.CalcUtilsTest',
            'name',
            `
java.lang.AssertionError: unexpected exception type thrown; expected:<java.lang.IllegalStateException> but was:<java.lang.IllegalArgumentException>
    at action.surefire.report.calc.CalcUtilsTest.test error handling(CalcUtilsTest.kt:27)
Caused by: java.lang.IllegalArgumentException: Amount must have max 2 non-zero decimal places
    at action.surefire.report.calc.CalcUtilsTest.scale(CalcUtilsTest.kt:31)
    at action.surefire.report.calc.CalcUtilsTest.access$scale(CalcUtilsTest.kt:9)
    at action.surefire.report.calc.CalcUtilsTest.test error handling(CalcUtilsTest.kt:27)
        `
        );
        expect(fileName).toBe('CalcUtilsTest');
        expect(line).toBe(27);
    });

    it('should parse correctly fileName and line for extended stacktrace', async () => {
        const { fileName, line } = await resolveFileAndLine(
            null,
            'action.surefire.report.calc.StringUtilsTest',
            'name',
            `
java.lang.AssertionError: 

Expected: (an instance of java.lang.IllegalArgumentException and exception with message a string containing "This is unexpected")
     but: exception with message a string containing "This is unexpected" message was "Input='' didn't match condition."
Stacktrace was: java.lang.IllegalArgumentException: Input='' didn't match condition.
	at action.surefire.report.calc.StringUtils.requireNotBlank(StringUtils.java:25)
	at action.surefire.report.calc.StringUtils.requireNotBlank(StringUtils.java:18)
	at action.surefire.report.calc.StringUtilsTest.require_fail(StringUtilsTest.java:26)
	at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
	at org.junit.runners.ParentRunner.run(ParentRunner.java:413)
	at org.apache.maven.surefire.junit4.JUnit4Provider.invoke(JUnit4Provider.java:159)
	at org.apache.maven.surefire.booter.ForkedBooter.main(ForkedBooter.java:418)
`
        );
        expect(fileName).toBe('StringUtilsTest');
        expect(line).toBe(26);
    });

    it('should parse correctly fileName and line for pytest', async () => {
        const { fileName, line } = await resolveFileAndLine(
            'test.py',
            'anything',
            'name',
            `
def
test_with_error():
event = { 'attr': 'test'}
&gt; assert event.attr == 'test'
E AttributeError: 'dict' object has no attribute 'attr'

test.py:14: AttributeError
`
        );
        expect(fileName).toBe('test.py');
        expect(line).toBe(14);
    });
});

describe('resolvePath', () => {
    it('should find correct file for Java fileName', async () => {
        const path = await resolvePath('EmailAddressTest');
        expect(path).toBe(
            'test_results/tests/email/src/test/java/action/surefire/report/email/EmailAddressTest.java'
        );
    });

    it('should find correct file for Kotlin fileName', async () => {
        const path = await resolvePath('CalcUtilsTest');
        expect(path).toBe('test_results/tests/utils/src/test/java/action/surefire/report/calc/CalcUtilsTest.kt');
    });
});

describe('parseFile', () => {
    it('should parse CalcUtils results', async () => {
        const { count, skipped, annotations } = await parseFile(
            'test_results/tests/utils/target/surefire-reports/TEST-action.surefire.report.calc.CalcUtilsTest.xml'
        );

        expect(count).toBe(2);
        expect(skipped).toBe(0);
        expect(annotations).toStrictEqual([
            {
                path: 'test_results/tests/utils/src/test/java/action/surefire/report/calc/CalcUtilsTest.kt',
                start_line: 27,
                end_line: 27,
                start_column: 0,
                end_column: 0,
                annotation_level: 'failure',
                title: 'CalcUtilsTest.test error handling',
                message:
                    'unexpected exception type thrown; expected:<java.lang.IllegalStateException> but was:<java.lang.IllegalArgumentException>',
                raw_details:
                    'java.lang.AssertionError: unexpected exception type thrown; expected:<java.lang.IllegalStateException> but was:<java.lang.IllegalArgumentException>\n\tat action.surefire.report.calc.CalcUtilsTest.test error handling(CalcUtilsTest.kt:27)\nCaused by: java.lang.IllegalArgumentException: Amount must have max 2 non-zero decimal places\n\tat action.surefire.report.calc.CalcUtilsTest.scale(CalcUtilsTest.kt:31)\n\tat action.surefire.report.calc.CalcUtilsTest.access$scale(CalcUtilsTest.kt:9)\n\tat action.surefire.report.calc.CalcUtilsTest.test error handling(CalcUtilsTest.kt:27)'
            },
            {
                path: 'test_results/tests/utils/src/test/java/action/surefire/report/calc/CalcUtilsTest.kt',
                start_line: 15,
                end_line: 15,
                start_column: 0,
                end_column: 0,
                annotation_level: 'failure',
                title: 'CalcUtilsTest.test scale',
                message: 'Expected: <100.10>\n     but: was <100.11>',
                raw_details:
                    'java.lang.AssertionError: \n\nExpected: <100.10>\n     but: was <100.11>\n\tat action.surefire.report.calc.CalcUtilsTest.test scale(CalcUtilsTest.kt:15)'
            }
        ]);
    });
    it('should parse pytest results', async () => {
        const { count, skipped, annotations } = await parseFile('test_results/python/report.xml');

        expect(count).toBe(3);
        expect(skipped).toBe(0);
        expect(annotations).toStrictEqual([
            {
                path: 'test_results/python/test_sample.py',
                start_line: 10,
                end_line: 10,
                start_column: 0,
                end_column: 0,
                annotation_level: 'failure',
                title: 'test_sample.test_which_fails',
                message: "AssertionError: assert 'test' == 'xyz'\n  - xyz\n  + test",
                raw_details:
                    "def test_which_fails():\n        event = { 'attr': 'test'}\n>       assert event['attr'] == 'xyz'\nE       AssertionError: assert 'test' == 'xyz'\nE         - xyz\nE         + test\n\npython/test_sample.py:10: AssertionError"
            },
            {
                path: 'test_results/python/test_sample.py',
                start_line: 14,
                end_line: 14,
                start_column: 0,
                end_column: 0,
                annotation_level: 'failure',
                title: 'test_sample.test_with_error',
                message: "AttributeError: 'dict' object has no attribute 'attr'",
                raw_details:
                    "def test_with_error():\n        event = { 'attr': 'test'}\n>       assert event.attr == 'test'\nE       AttributeError: 'dict' object has no attribute 'attr'\n\npython/test_sample.py:14: AttributeError"
            }
        ]);
    });

    it('should parse marathon results', async () => {
        const { count, skipped, annotations } = await parseFile('test_results/marathon_tests/com.mikepenz.DummyTest#test_02_dummy.xml');

        expect(count).toBe(1);
        expect(skipped).toBe(0);
        expect(annotations).toStrictEqual([]);
    });

    it('should parse marathon results and retrieve message', async () => {
        const { count, skipped, annotations } = await parseFile('test_results/marathon_tests/com.mikepenz.DummyTest3#test_01.xml');

        expect(count).toBe(1);
        expect(skipped).toBe(0);
        expect(annotations).toStrictEqual([
            {
                "annotation_level": "failure",
                "end_column": 0,
                "end_line": 1,
                "message": "test_01",
                "path": "DummyTest3",
                "raw_details": "",
                "start_column": 0,
                "start_line": 1,
                "title": "DummyTest3.test_01",
            }
        ]);
    });

    it('should parse and fail marathon results', async () => {
        const { count, skipped, annotations } = await parseFile('test_results/marathon_tests/com.mikepenz.DummyUtilTest#test_01_dummy.xml');

        expect(count).toBe(1);
        expect(skipped).toBe(0);
        expect(annotations).toStrictEqual([
            {
                "annotation_level": "failure",
                "end_column": 0,
                "end_line": 1,
                "message": "java.io.FileNotFoundException: No content provider: content://com.xyz/photo.jpg\nat android.content.ContentResolver.openTypedAssetFileDescriptor(ContentResolver.java:1969)",
                "path": "DummyUtilTest",
                "raw_details": "java.io.FileNotFoundException: No content provider: content://com.xyz/photo.jpg\nat android.content.ContentResolver.openTypedAssetFileDescriptor(ContentResolver.java:1969)\nat android.app.Instrumentation$InstrumentationThread.run(Instrumentation.java:2205)",
                "start_column": 0,
                "start_line": 1,
                "title": "DummyUtilTest.test_01_dummy",
            },
        ]);
    });

    it('should parse empty cunit results', async () => {
        const { count, skipped, annotations } = await parseFile('test_results/cunit/testEmpty.xml');

        expect(count).toBe(0);
        expect(skipped).toBe(0);
        expect(annotations).toStrictEqual([]);
    });

    it('should parse failure cunit results', async () => {
        const { count, skipped, annotations } = await parseFile('test_results/cunit/testFailure.xml');

        expect(count).toBe(4);
        expect(skipped).toBe(0);
        expect(annotations).toStrictEqual([
            {
                "annotation_level": "failure",
                "end_column": 0,
                "end_line": 1,
                "message": "false == something.loadXml(xml_string)",
                "path": "loadFromXMLString_When_Should2Test",
                "raw_details": "false == something.loadXml(xml_string)\nFile: /dumm/core/tests/testFailure.cpp\nLine: 77",
                "start_column": 0,
                "start_line": 1,
                "title": "loadFromXMLString_When_Should2Test.loadFromXMLString_When_Should2Test",
            },
        ]);
    });

    it('should parse correctly fileName and line for a Java file with invalid chars', async () => {
        const { fileName, line } = await resolveFileAndLine(
            null,
            'action.surefire.report.email.EmailAddressTest++',
            'name',
            `
action.surefire.report.email.InvalidEmailAddressException: Invalid email address 'user@ñandú.com.ar'
    at action.surefire.report.email.EmailAddressTest.expectException(EmailAddressTest++.java:74)
    at action.surefire.report.email.EmailAddressTest.shouldNotContainInternationalizedHostNames(EmailAddressTest++.java:39)
        `
        );
        expect(fileName).toBe('EmailAddressTest++');
        expect(line).toBe(39);
    });

    it('should parse correctly nested test suites', async () => {
        const { count, skipped, annotations } = await parseFile('test_results/nested/junit.xml', 'Test*');

        expect(count).toBe(5);
        expect(skipped).toBe(0);
        expect(annotations).toStrictEqual([{
            "path": "A",
            "start_line": 1,
            "end_line": 1,
            "start_column": 0,
            "end_column": 0,
            "annotation_level": "failure",
            "title": "A.TestA/A",
            "message": "failure",
            "raw_details": ""
        }, {
            "path": "B",
            "start_line": 1,
            "end_line": 1,
            "start_column": 0,
            "end_column": 0,
            "annotation_level": "failure",
            "title": "B.TestB/B",
            "message": "failure",
            "raw_details": ""
        }, {
            "path": "A",
            "start_line": 1,
            "end_line": 1,
            "start_column": 0,
            "end_column": 0,
            "annotation_level": "failure",
            "title": "A.A",
            "message": "failure",
            "raw_details": ""
        }]);
    });
});
